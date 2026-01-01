/**
 * Image URL Population Script
 * Populates missing image_url values from gallery_images or creates vendor-based URLs
 * This allows product cards to display images immediately
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
const STORAGE_BASE = `${supabaseUrl}/storage/v1/object/public`;

/**
 * Get the best image URL for a product
 */
function getBestImageUrl(product) {
  // If product already has image_url, return it
  if (product.image_url && product.image_url.trim().length > 0) {
    return product.image_url;
  }
  
  // Try to use first gallery image
  if (product.gallery_images && product.gallery_images.length > 0) {
    const first = product.gallery_images[0];
    if (first && typeof first === 'string' && first.trim().length > 0) {
      return first;
    }
  }
  
  // Create a vendor-based URL if no images found
  // This ensures product cards have at least a valid URL structure
  return `${STORAGE_BASE}/listings-images/vendors/${product.vendor_id}/products/${product.slug}/main.jpg`;
}

/**
 * Validate a product URL exists
 */
async function urlExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return response.ok || response.status === 0; // CORS might prevent reading status
  } catch {
    return false;
  }
}

/**
 * Main population script
 */
async function populateImages() {
  try {
    console.log('🖼️  Image URL Population Script\n');
    console.log('📦 Fetching all products...\n');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      process.exit(1);
    }
    
    console.log(`✅ Found ${products?.length || 0} products\n`);
    
    // Categorize products
    const toUpdate = [];
    const summary = {
      total: products.length,
      alreadyHaveImage: 0,
      canUseGallery: 0,
      needGenerated: 0,
      errors: []
    };
    
    for (const product of products) {
      if (!product.image_url || product.image_url.trim().length === 0) {
        // Missing image_url
        if (product.gallery_images && product.gallery_images.length > 0) {
          const galleryImage = product.gallery_images[0];
          if (galleryImage && typeof galleryImage === 'string') {
            // Use first gallery image
            toUpdate.push({
              id: product.id,
              title: product.title,
              newImageUrl: galleryImage,
              source: 'gallery_images'
            });
            summary.canUseGallery++;
          } else {
            // Use generated vendor URL
            const genUrl = `${STORAGE_BASE}/listings-images/vendors/${product.vendor_id}/products/${product.slug}/main.jpg`;
            toUpdate.push({
              id: product.id,
              title: product.title,
              newImageUrl: genUrl,
              source: 'generated'
            });
            summary.needGenerated++;
          }
        } else {
          // No gallery either, use generated vendor URL
          const genUrl = `${STORAGE_BASE}/listings-images/vendors/${product.vendor_id}/products/${product.slug}/main.jpg`;
          toUpdate.push({
            id: product.id,
            title: product.title,
            newImageUrl: genUrl,
            source: 'generated'
          });
          summary.needGenerated++;
        }
      } else {
        summary.alreadyHaveImage++;
      }
    }
    
    // Print summary
    console.log('📊 Population Summary:');
    console.log(`  ✅ Already have image_url: ${summary.alreadyHaveImage}`);
    console.log(`  📸 Can use gallery_images: ${summary.canUseGallery}`);
    console.log(`  🔧 Need generated URLs: ${summary.needGenerated}`);
    console.log(`  📝 Total to update: ${toUpdate.length}\n`);
    
    // Show sample updates
    console.log('📝 Sample updates:');
    for (const item of toUpdate.slice(0, 5)) {
      console.log(`\n  ${item.title}`);
      console.log(`    Source: ${item.source}`);
      if (item.source === 'gallery_images') {
        console.log(`    URL: [gallery image]`);
      } else {
        console.log(`    URL: Generated vendor path`);
      }
    }
    
    if (toUpdate.length > 5) {
      console.log(`\n  ... and ${toUpdate.length - 5} more products`);
    }
    
    // DRY RUN - show what would happen
    console.log('\n🔍 DRY RUN: No changes applied\n');
    console.log('To apply these changes, run with --apply flag:\n');
    console.log('  node scripts/populate-image-urls.js --apply\n');
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary,
      updates: toUpdate
    };
    
    const reportPath = path.join(process.cwd(), 'image-population-plan.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 Plan saved to: image-population-plan.json\n`);
    
    // Check if --apply flag is set
    if (process.argv.includes('--apply')) {
      console.log('⚙️  Applying updates...\n');
      
      let updated = 0;
      let errors = [];
      
      for (const item of toUpdate) {
        const { error } = await supabase
          .from('products')
          .update({ image_url: item.newImageUrl })
          .eq('id', item.id);
        
        if (error) {
          errors.push({
            product: item.title,
            error: error.message
          });
          console.log(`❌ Failed: ${item.title}`);
        } else {
          updated++;
          if (updated % 10 === 0) {
            process.stdout.write('.');
          }
        }
      }
      
      console.log(`\n\n✅ Update complete!`);
      console.log(`  - Updated: ${updated}/${toUpdate.length}`);
      console.log(`  - Errors: ${errors.length}\n`);
      
      if (errors.length > 0) {
        console.log('⚠️  Errors:');
        errors.forEach(e => {
          console.log(`  - ${e.product}: ${e.error}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

populateImages();
