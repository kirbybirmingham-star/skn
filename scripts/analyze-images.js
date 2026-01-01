/**
 * Image Analysis Script
 * Analyzes product images and gallery in database
 * Shows which images exist and where they're stored
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Extract bucket name from URL
 */
function extractBucket(url) {
  if (!url) return null;
  try {
    const match = url.match(/\/public\/([^\/]+)\//);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Main analysis
 */
async function analyzeImages() {
  try {
    console.log('🔍 Analyzing product images...\n');
    
    // Get all products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, slug, category_id, image_url, gallery_images, vendor_id, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      process.exit(1);
    }
    
    console.log(`📦 Found ${products?.length || 0} products\n`);
    
    // Analyze images
    const analysis = {
      totalProducts: products.length,
      withImageUrl: 0,
      withGallery: 0,
      withoutAny: 0,
      buckets: {},
      products: []
    };
    
    for (const product of products) {
      const item = {
        id: product.id,
        title: product.title,
        slug: product.slug,
        image_url: product.image_url || null,
        gallery_count: product.gallery_images?.length || 0,
        gallery_items: product.gallery_images || []
      };
      
      // Count by type
      if (product.image_url) {
        analysis.withImageUrl++;
        const bucket = extractBucket(product.image_url);
        if (bucket) {
          analysis.buckets[bucket] = (analysis.buckets[bucket] || 0) + 1;
        }
      }
      if (product.gallery_images?.length > 0) {
        analysis.withGallery++;
      }
      if (!product.image_url && (!product.gallery_images || product.gallery_images.length === 0)) {
        analysis.withoutAny++;
      }
      
      analysis.products.push(item);
    }
    
    // Print summary
    console.log('📊 Summary:');
    console.log(`  ✅ Products with image_url: ${analysis.withImageUrl}`);
    console.log(`  ✅ Products with gallery_images: ${analysis.withGallery}`);
    console.log(`  ❌ Products without any images: ${analysis.withoutAny}`);
    
    console.log('\n💾 Image URL Sources (Buckets):');
    for (const [bucket, count] of Object.entries(analysis.buckets)) {
      console.log(`  - ${bucket}: ${count} products`);
    }
    
    // Show sample products
    console.log('\n📝 Sample Products:');
    for (const product of analysis.products.slice(0, 5)) {
      console.log(`\n  ${product.title}`);
      if (product.image_url) {
        const bucket = extractBucket(product.image_url);
        console.log(`    📷 image_url: ${bucket ? `[${bucket}]` : ''}`);
        console.log(`       ${product.image_url.split('/public/')[1]?.substring(0, 80)}...`);
      } else {
        console.log(`    📷 image_url: (empty)`);
      }
      if (product.gallery_count > 0) {
        console.log(`    🖼️  gallery: ${product.gallery_count} images`);
      }
    }
    
    // Show products without images
    const withoutImages = analysis.products.filter(p => !p.image_url && p.gallery_count === 0);
    if (withoutImages.length > 0) {
      console.log(`\n⚠️  Products without images (${withoutImages.length}):`);
      for (const product of withoutImages.slice(0, 5)) {
        console.log(`  - ${product.title}`);
      }
      if (withoutImages.length > 5) {
        console.log(`  ... and ${withoutImages.length - 5} more`);
      }
    }
    
    // Save full report
    const reportPath = path.join(process.cwd(), 'image-analysis-report.json');
    await fs.writeFile(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`\n💾 Full report saved to: image-analysis-report.json`);
    
    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

analyzeImages();
