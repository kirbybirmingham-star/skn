#!/usr/bin/env node
/**
 * Upload Product Images - Vendor-Organized Storage
 * 
 * Uploads images for vendor products with structure:
 * listings-images/vendors/{vendor_id}/products/{product_slug}/...
 * 
 * Usage:
 *   node scripts/upload-vendor-product-images.js [--vendor-id UUID] [--product-slug slug]
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import sharp from 'sharp';
import {
  getProductMainImagePath,
  getProductThumbnailPath,
  getProductGalleryImagePath,
  getPublicUrl
} from '../src/lib/storagePathBuilder.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

const BUCKET = 'listings-images';
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

/**
 * Download image from URL
 */
async function downloadImage(url) {
  const response = await fetch(url, { timeout: 10000 });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Resize image to specified width and convert to JPEG
 */
async function resizeImage(buffer, width = 1200) {
  let result = await sharp(buffer)
    .resize(width, Math.floor(width * 0.75), { fit: 'cover' })
    .jpeg({ quality: 85 })
    .toBuffer();

  // Ensure under 2MB
  const MAX_SIZE = 2 * 1024 * 1024;
  let quality = 85;
  while (result.length > MAX_SIZE && quality > 50) {
    quality -= 10;
    result = await sharp(buffer)
      .resize(width, Math.floor(width * 0.75), { fit: 'cover' })
      .jpeg({ quality })
      .toBuffer();
  }

  return result;
}

/**
 * Upload main image
 */
async function uploadMainImage(vendorId, productSlug, imageUrl) {
  console.log('  → Downloading main image...');
  const buffer = await downloadImage(imageUrl);

  console.log('  → Resizing and compressing...');
  const jpeg = await resizeImage(buffer, 1200);
  console.log(`    Size: ${(jpeg.length / 1024).toFixed(1)} KB`);

  const path = getProductMainImagePath(vendorId, productSlug);
  console.log(`  → Uploading to storage (${path})...`);
  
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, jpeg, { contentType: 'image/jpeg', upsert: true });

  if (error) throw error;

  const publicUrl = getPublicUrl(supabaseUrl, BUCKET, path);
  console.log(`  ✅ Main image uploaded`);
  console.log(`     URL: ${publicUrl}`);

  return publicUrl;
}

/**
 * Upload thumbnail
 */
async function uploadThumbnail(vendorId, productSlug, imageUrl) {
  console.log('  → Creating thumbnail...');
  const buffer = await downloadImage(imageUrl);
  const thumbnail = await resizeImage(buffer, 200);

  const path = getProductThumbnailPath(vendorId, productSlug);
  console.log(`  → Uploading thumbnail (${path})...`);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, thumbnail, { contentType: 'image/jpeg', upsert: true });

  if (error) throw error;

  const publicUrl = getPublicUrl(supabaseUrl, BUCKET, path);
  console.log(`  ✅ Thumbnail uploaded`);
  console.log(`     URL: ${publicUrl}`);

  return publicUrl;
}

/**
 * Upload gallery images
 */
async function uploadGalleryImages(vendorId, productSlug, imageUrls) {
  const results = [];

  for (let i = 0; i < imageUrls.length; i++) {
    console.log(`  → Downloading gallery image ${i + 1}...`);
    const buffer = await downloadImage(imageUrls[i]);

    console.log(`  → Resizing gallery image ${i + 1}...`);
    const jpeg = await resizeImage(buffer, 1000);

    const path = getProductGalleryImagePath(vendorId, productSlug, i + 1);
    console.log(`  → Uploading gallery image ${i + 1} (${path})...`);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, jpeg, { contentType: 'image/jpeg', upsert: true });

    if (error) throw error;

    const publicUrl = getPublicUrl(supabaseUrl, BUCKET, path);
    console.log(`  ✅ Gallery image ${i + 1} uploaded`);
    console.log(`     URL: ${publicUrl}`);
    results.push(publicUrl);
  }

  return results;
}

/**
 * Main upload function
 */
async function uploadProductImages(vendorId, productSlug, imageConfig) {
  console.log(`\n📦 Uploading Images for: ${productSlug}`);
  console.log(`   Vendor: ${vendorId}`);
  console.log('=====================================\n');

  try {
    const results = {};

    // Upload main image
    if (imageConfig.main) {
      console.log('📸 Main Image:');
      results.main = await uploadMainImage(vendorId, productSlug, imageConfig.main);
    }

    // Upload thumbnail
    if (imageConfig.main) {
      console.log('\n🔍 Thumbnail:');
      results.thumbnail = await uploadThumbnail(vendorId, productSlug, imageConfig.main);
    }

    // Upload gallery images
    if (imageConfig.gallery && imageConfig.gallery.length > 0) {
      console.log('\n🖼️  Gallery Images:');
      results.gallery = await uploadGalleryImages(vendorId, productSlug, imageConfig.gallery);
    }

    console.log('\n✅ Upload Complete!\n');
    return results;
  } catch (err) {
    console.error(`\n❌ Upload failed: ${err.message}\n`);
    throw err;
  }
}

// Example usage
async function main() {
  // Example: Upload images for a product
  const vendorId = 'a7b8c9d0-e1f2-3456-7890-bcdef0123456'; // Jane's Gadgets
  const productSlug = 'wireless-mouse';

  const imageConfig = {
    main: 'https://images.unsplash.com/photo-1527814050087-3793815479db',
    gallery: [
      'https://images.unsplash.com/photo-1527814050087-3793815479db',
      'https://images.unsplash.com/photo-1586253408284-8202a7c82ff3',
      'https://images.unsplash.com/photo-1527814050087-3793815479db'
    ]
  };

  try {
    const results = await uploadProductImages(vendorId, productSlug, imageConfig);
    console.log('Uploaded URLs:');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}

// Uncomment to run example
// main().catch(console.error);

export { uploadProductImages, uploadMainImage, uploadThumbnail, uploadGalleryImages };
