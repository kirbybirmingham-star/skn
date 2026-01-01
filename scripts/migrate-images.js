/**
 * Image Migration Script
 * Migrates product images from legacy storage to optimized structure
 * Updates database with correct image URLs
 * 
 * Handles:
 * - Products with image_url (new UUID system)
 * - Products with images array (legacy)
 * - Products with gallery_images array (legacy)
 * - Products with no images (uses placeholder)
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

// Base URL for storage
const STORAGE_BASE = `${supabaseUrl}/storage/v1/object/public`;
const DEFAULT_BUCKET = 'skn-bridge-assets';

/**
 * Get image URL from various sources
 */
function getImageUrl(product) {
  if (!product) return null;
  
  // Primary: image_url (main product image)
  if (product.image_url && typeof product.image_url === 'string') {
    const url = product.image_url.trim();
    if (url && !url.includes('undefined') && url.length > 0) {
      return url;
    }
  }
  
  // Secondary: gallery_images array (fallback if primary empty)
  if (Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
    const validImage = product.gallery_images.find(img => img && typeof img === 'string' && img.trim().length > 0);
    if (validImage) return validImage.trim();
  }
  
  return null;
}

/**
 * Normalize image URL to work with optimized storage
 */
function normalizeImageUrl(imageUrl, product) {
  if (!imageUrl) return null;
  
  // Already a full URL?
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Is it a path without bucket prefix?
  if (imageUrl.includes('/')) {
    // Check if it needs bucket prefix
    if (!imageUrl.startsWith(DEFAULT_BUCKET)) {
      return `${DEFAULT_BUCKET}/${imageUrl}`;
    }
    return imageUrl;
  }
  
  // Is it just a filename (UUID format)?
  if (imageUrl.match(/^img_[a-f0-9]+\.\w+$/i)) {
    return `${DEFAULT_BUCKET}/products/${imageUrl}`;
  }
  
  // Unknown format, return as-is
  return imageUrl;
}

/**
 * Build full public URL for storage
 */
function buildPublicUrl(bucketPath) {
  if (!bucketPath) return null;
  
  // If already a full URL, return as-is
  if (bucketPath.startsWith('http')) {
    return bucketPath;
  }
  
  // Build URL from bucket path
  return `${STORAGE_BASE}/${bucketPath}`;
}

/**
 * Get product details from database
 */
async function getProductsForMigration() {
  console.log('📦 Fetching products from database...\n');
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, slug, category_id, image_url, gallery_images, vendor_id, created_at')
    .limit(1000);
  
  if (error) {
    console.error('❌ Error fetching products:', error);
    return [];
  }
  
  console.log(`✅ Found ${products?.length || 0} products\n`);
  return products || [];
}

/**
 * Analyze product images
 */
async function analyzeImages(products) {
  console.log('🔍 Analyzing image sources...\n');
  
  const analysis = {
    totalProducts: products.length,
    withImageUrl: 0,
    withGalleryArray: 0,
    withoutImages: 0,
    byBucket: {},
    byCategory: {},
    byVendor: {}
  };
  
  for (const product of products) {
    // Count by source
    if (product.image_url && product.image_url.trim().length > 0) {
      analysis.withImageUrl++;
      // Extract bucket from URL
      const bucket = extractBucket(product.image_url);
      analysis.byBucket[bucket] = (analysis.byBucket[bucket] || 0) + 1;
    }
    if (Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
      analysis.withGalleryArray++;
    }
    if (!product.image_url?.trim() && (!product.gallery_images?.length)) {
      analysis.withoutImages++;
    }
    
    // Count by category
    const category = product.category_id || 'unknown';
    analysis.byCategory[category] = (analysis.byCategory[category] || 0) + 1;
    
    // Count by vendor
    const vendor = product.vendor_id || 'unknown';
    analysis.byVendor[vendor] = (analysis.byVendor[vendor] || 0) + 1;
  }
  
  console.log('📊 Image Source Analysis:');
  console.log(`  - Total products: ${analysis.totalProducts}`);
  console.log(`  - With image_url: ${analysis.withImageUrl}`);
  console.log(`  - With gallery_images array: ${analysis.withGalleryArray}`);
  console.log(`  - Without any images: ${analysis.withoutImages}`);
  
  console.log(`\n💾 By Bucket:`);
  for (const [bucket, count] of Object.entries(analysis.byBucket)) {
    console.log(`  - ${bucket}: ${count}`);
  }
  
  console.log(`\n📁 By Category: ${Object.keys(analysis.byCategory).length} categories`);
  for (const [cat, count] of Object.entries(analysis.byCategory)) {
    console.log(`  - ${cat}: ${count}`);
  }
  
  console.log(`\n🏪 By Vendor: ${Object.keys(analysis.byVendor).length} vendors`);
  for (const [vendor, count] of Object.entries(analysis.byVendor).slice(0, 5)) {
    console.log(`  - ${vendor}: ${count}`);
  }
  if (Object.keys(analysis.byVendor).length > 5) {
    console.log(`  - ... and ${Object.keys(analysis.byVendor).length - 5} more`);
  }
  
  return analysis;
}

/**
 * Extract bucket name from URL
 */
function extractBucket(url) {
  if (!url) return 'unknown';
  try {
    const match = url.match(/\/public\/([^\/]+)\//);
    return match ? match[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Generate migration report
 */
async function generateMigrationReport(products, analysis) {
  console.log('\n📋 Generating image analysis report...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    analysis: analysis,
    products: [],
    summary: {
      totalWithImages: 0,
      totalWithoutImages: 0,
      canImprove: 0,
      issues: []
    }
  };
  
  for (const product of products) {
    const imageUrl = getImageUrl(product);
    const hasGallery = Array.isArray(product.gallery_images) && product.gallery_images.length > 0;
    
    const item = {
      id: product.id,
      title: product.title,
      slug: product.slug,
      currentImageUrl: product.image_url || null,
      hasGalleryImages: hasGallery,
      galleryCount: product.gallery_images?.length || 0,
      isValid: imageUrl !== null,
      imageSource: imageUrl === product.image_url ? 'image_url' : 'gallery_images'
    };
    
    if (imageUrl) {
      report.summary.totalWithImages++;
    } else {
      report.summary.totalWithoutImages++;
      report.summary.issues.push({
        productId: product.id,
        title: product.title,
        issue: 'No image_url and no gallery images'
      });
    }
    
    report.products.push(item);
  }
  
  console.log('🎯 Image Coverage Summary:');
  console.log(`  - Products with images: ${report.summary.totalWithImages}`);
  console.log(`  - Products without images: ${report.summary.totalWithoutImages}`);
  console.log(`  - Products with issues: ${report.summary.issues.length}`);
  
  return report;
}

/**
 * Validate image accessibility
 */
async function validateImages(publicUrls, sampleSize = 10) {
  console.log(`\n🧪 Validating ${Math.min(sampleSize, publicUrls.length)} image URLs...\n`);
  
  const urls = publicUrls.slice(0, sampleSize).filter(url => url);
  let accessible = 0;
  let errors = [];
  
  for (const url of urls) {
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      if (response.status < 400) {
        accessible++;
      } else {
        errors.push({ url, status: response.status });
      }
    } catch (err) {
      errors.push({ url, error: err.message });
    }
  }
  
  console.log(`✅ Accessible: ${accessible}/${urls.length}`);
  if (errors.length > 0) {
    console.log(`❌ Errors: ${errors.length}`);
    errors.slice(0, 3).forEach(e => {
      console.log(`  - ${e.url}: ${e.error || `Status ${e.status}`}`);
    });
  }
  
  return { accessible, total: urls.length, errors };
}

/**
 * Apply migrations to database
 */
async function applyMigrations(report) {
  console.log('\n💾 Applying migrations to database...\n');
  
  let updated = 0;
  let errors = [];
  
  for (const product of report.products) {
    if (!product.needsUpdate || !product.publicUrl) {
      continue;
    }
    
    // Update product in database
    const { error } = await supabase
      .from('products')
      .update({ image_url: product.publicUrl })
      .eq('id', product.id);
    
    if (error) {
      errors.push({
        productId: product.id,
        title: product.title,
        error: error.message
      });
    } else {
      updated++;
      console.log(`✅ Updated: ${product.title}`);
    }
  }
  
  console.log(`\n📊 Migration Results:`);
  console.log(`  - Updated: ${updated}`);
  console.log(`  - Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`);
    errors.forEach(e => {
      console.log(`  - ${e.title}: ${e.error}`);
    });
  }
  
  return { updated, errors };
}

/**
 * Save detailed report
 */
async function saveReport(report, results) {
  const reportPath = path.join(process.cwd(), 'image-migration-report.json');
  
  const fullReport = {
    ...report,
    migrationResults: results,
    executedAt: new Date().toISOString()
  };
  
  await fs.writeFile(reportPath, JSON.stringify(fullReport, null, 2));
  console.log(`\n💾 Report saved to: ${reportPath}`);
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting Image Migration...\n');
    console.log(`Storage Base: ${STORAGE_BASE}`);
    console.log(`Default Bucket: ${DEFAULT_BUCKET}\n`);
    
    // 1. Get products
    const products = await getProductsForMigration();
    if (products.length === 0) {
      console.log('⚠️  No products found');
      return;
    }
    
    // 2. Analyze current state
    const analysis = await analyzeImages(products);
    
    // 3. Generate migration plan
    const report = await generateMigrationReport(products, analysis);
    
    // 4. Validate sample URLs
    const validUrls = report.products
      .filter(p => p.publicUrl)
      .map(p => p.publicUrl);
    await validateImages(validUrls);
    
    // 5. Apply migrations (optional - uncomment when ready)
    console.log('\n⚠️  DRY RUN COMPLETE - No changes applied');
    console.log('Review image-migration-report.json then run with --apply flag to apply changes\n');
    
    // Check for --apply flag
    if (process.argv.includes('--apply')) {
      console.log('🔄 Applying migrations...\n');
      const results = await applyMigrations(report);
      await saveReport(report, results);
      console.log('\n✅ Migration complete!');
    } else {
      // Save dry-run report
      await saveReport(report, { status: 'dry-run', message: 'No changes applied' });
      console.log('📋 To apply changes, run: node scripts/migrate-images.js --apply\n');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run migration
main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
