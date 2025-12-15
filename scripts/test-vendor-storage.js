#!/usr/bin/env node
/**
 * Test Vendor-Organized Storage Structure
 * 
 * Demonstrates the new storage organization:
 * listings-images/vendors/{vendor_id}/products/{product_slug}/...
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  getProductMainImagePath,
  getProductThumbnailPath,
  getProductGalleryImagePath,
  getVendorProductsDirectory,
  getProductDirectory,
  getPublicUrl
} from '../src/lib/storagePathBuilder.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

async function testVendorStorageStructure() {
  console.log('🏢 Testing Vendor-Organized Storage Structure\n');
  console.log('========================================\n');

  // Get actual Supabase URL
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

  // Example vendor and product
  const vendorId = 'a7b8c9d0-e1f2-3456-7890-bcdef0123456'; // Jane's Gadgets
  const productSlug = 'wireless-mouse';

  console.log('📁 Storage Paths Generated:');
  console.log('---------------------------\n');

  // Main image path
  const mainPath = getProductMainImagePath(vendorId, productSlug);
  console.log(`Main Image:`);
  console.log(`  Path: ${mainPath}`);
  console.log(`  URL:  ${getPublicUrl(supabaseUrl, 'listings-images', mainPath)}\n`);

  // Thumbnail path
  const thumbPath = getProductThumbnailPath(vendorId, productSlug);
  console.log(`Thumbnail:`);
  console.log(`  Path: ${thumbPath}`);
  console.log(`  URL:  ${getPublicUrl(supabaseUrl, 'listings-images', thumbPath)}\n`);

  // Gallery images
  console.log(`Gallery Images:`);
  for (let i = 1; i <= 3; i++) {
    const galleryPath = getProductGalleryImagePath(vendorId, productSlug, i);
    console.log(`  [${i}] Path: ${galleryPath}`);
    console.log(`      URL:  ${getPublicUrl(supabaseUrl, 'listings-images', galleryPath)}\n`);
  }

  // Directory paths
  console.log('📂 Directory Structures:');
  console.log('------------------------\n');

  const vendorDir = getVendorProductsDirectory(vendorId);
  console.log(`Vendor Products Directory:`);
  console.log(`  Path: ${vendorDir}\n`);

  const productDir = getProductDirectory(vendorId, productSlug);
  console.log(`Product Directory:`);
  console.log(`  Path: ${productDir}\n`);

  // Test listing images for a vendor
  console.log('🔍 Testing Storage Access:');
  console.log('---------------------------\n');

  try {
    const { data: vendorImages, error: vendorError } = await supabase.storage
      .from('listings-images')
      .list(`vendors/${vendorId}/products`, { recursive: true });

    if (vendorError) {
      console.log(`✗ Cannot list vendor images: ${vendorError.message}`);
    } else {
      console.log(`✓ Vendor Images: ${vendorImages.length} items found`);
      if (vendorImages.length > 0) {
        vendorImages.slice(0, 5).forEach(item => {
          console.log(`  - ${item.name}`);
        });
        if (vendorImages.length > 5) console.log(`  ... and ${vendorImages.length - 5} more`);
      }
    }
  } catch (err) {
    console.error(`Error listing vendor images: ${err.message}`);
  }

  console.log('\n✅ Storage structure test complete!\n');
}

testVendorStorageStructure().catch(console.error);
