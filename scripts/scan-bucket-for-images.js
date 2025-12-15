#!/usr/bin/env node
/**
 * Scan and Map Existing Images to Vendor Storage
 * 
 * This script:
 * 1. Scans the listings-images bucket for existing product images
 * 2. Matches them to products by slug and vendor
 * 3. Generates the new vendor-organized paths
 * 4. Reports migration mapping
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  getProductMainImagePath,
  getProductThumbnailPath,
  parseStoragePath
} from '../src/lib/storagePathBuilder.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

/**
 * Scan bucket for images matching product slugs
 */
async function scanBucketForImages() {
  console.log('📁 Scanning listings-images bucket for existing images...\n');

  const imageMap = new Map();

  try {
    // List all files in products folder
    const { data, error } = await supabase.storage
      .from('listings-images')
      .list('products', { recursive: true });

    if (error) throw error;

    console.log(`Found ${data.length} items in products folder\n`);

    // Organize by product slug
    for (const item of data) {
      if (item.name === '.emptyFolderPlaceholder') continue;

      // Extract product slug from path
      // Paths like: products/product-slug/main.jpg or products/product-slug/gallery/1.jpg
      const match = item.name.match(/^([^/]+)/);
      if (!match) continue;

      const productSlug = match[1];
      const fullPath = `products/${item.name}`;

      if (!imageMap.has(productSlug)) {
        imageMap.set(productSlug, []);
      }

      imageMap.get(productSlug).push({
        name: item.name,
        path: fullPath,
        type: item.name.includes('gallery') ? 'gallery' : 
              item.name.includes('thumbnail') ? 'thumbnail' : 'main'
      });
    }

    return imageMap;
  } catch (err) {
    console.error('Error scanning bucket:', err.message);
    process.exit(1);
  }
}

/**
 * Get all products with vendor info
 */
async function getProductsWithVendors() {
  console.log('📦 Fetching products from database...\n');

  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, slug, vendor_id, image_url')
      .order('vendor_id, created_at');

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error('Error fetching products:', err.message);
    process.exit(1);
  }
}

/**
 * Match images to products and generate migration map
 */
async function createMigrationMap() {
  const imageMap = await scanBucketForImages();
  const products = await getProductsWithVendors();

  console.log('🔍 Matching images to products...\n');

  const migrations = [];
  const unmappedImages = new Map(imageMap);
  const unmappedProducts = [];

  for (const product of products) {
    const images = imageMap.get(product.slug);

    if (!images) {
      unmappedProducts.push(product);
      continue;
    }

    // Find main image
    const mainImage = images.find(img => img.type === 'main');
    if (mainImage) {
      unmappedImages.delete(product.slug);
    }

    migrations.push({
      productId: product.id,
      productSlug: product.slug,
      vendorId: product.vendor_id,
      currentImageUrl: product.image_url,
      oldPath: mainImage?.path || null,
      newPath: mainImage ? getProductMainImagePath(product.vendor_id, product.slug) : null,
      images: images
    });
  }

  return {
    migrations,
    unmappedImages: Array.from(unmappedImages.entries()),
    unmappedProducts
  };
}

/**
 * Display migration report
 */
async function generateReport() {
  const { migrations, unmappedImages, unmappedProducts } = await createMigrationMap();

  console.log('\n📊 Migration Report');
  console.log('='.repeat(80));

  // Summary
  console.log('\n📈 Summary:');
  console.log(`  Total products: ${migrations.length}`);
  console.log(`  With images to migrate: ${migrations.filter(m => m.oldPath).length}`);
  console.log(`  Without images: ${unmappedProducts.length}`);
  console.log(`  Orphaned images (no product): ${unmappedImages.length}\n`);

  // Products with images to migrate
  console.log('✅ Products with images to migrate:');
  console.log('-'.repeat(80));
  migrations
    .filter(m => m.oldPath)
    .slice(0, 10)
    .forEach((m, i) => {
      console.log(`${i + 1}. ${m.productSlug}`);
      console.log(`   Vendor: ${m.vendorId}`);
      console.log(`   Old: ${m.oldPath}`);
      console.log(`   New: ${m.newPath}`);
      console.log(`   Images: ${m.images.length} files\n`);
    });

  if (migrations.filter(m => m.oldPath).length > 10) {
    console.log(`... and ${migrations.filter(m => m.oldPath).length - 10} more\n`);
  }

  // Products without images
  if (unmappedProducts.length > 0) {
    console.log('\n⚠️  Products without images:');
    console.log('-'.repeat(80));
    unmappedProducts.slice(0, 5).forEach((p, i) => {
      console.log(`${i + 1}. ${p.slug} (Vendor: ${p.vendor_id})`);
    });
    if (unmappedProducts.length > 5) {
      console.log(`... and ${unmappedProducts.length - 5} more`);
    }
  }

  // Orphaned images
  if (unmappedImages.length > 0) {
    console.log('\n🔍 Orphaned images (no matching product):');
    console.log('-'.repeat(80));
    unmappedImages.slice(0, 5).forEach(([slug, images]) => {
      console.log(`  ${slug}: ${images.length} files`);
    });
    if (unmappedImages.length > 5) {
      console.log(`  ... and ${unmappedImages.length - 5} more`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Report complete!\n');

  // Export migration map as JSON
  console.log('💾 Exporting migration map...');
  const fs = await import('fs').then(m => m.default);
  fs.writeFileSync(
    'migration-map.json',
    JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: migrations.length,
        withImages: migrations.filter(m => m.oldPath).length,
        withoutImages: unmappedProducts.length,
        orphanedImages: unmappedImages.length
      },
      migrations,
      unmappedProducts,
      orphanedImages: Object.fromEntries(unmappedImages)
    }, null, 2)
  );
  console.log('📄 Saved to migration-map.json\n');

  process.exit(0);
}

generateReport().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
