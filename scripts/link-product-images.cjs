#!/usr/bin/env node

/**
 * Link Product Images Script
 * This script links uploaded images in Supabase storage to the corresponding products
 * by updating the vendor_products.image_url field with public URLs.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env file');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const imageMapping = [
  {
    filename: 'headphones.jpg',
    productTitle: 'Premium Wireless Headphones'
  },
  {
    filename: 'coffee.jpg',
    productTitle: 'Organic Coffee Beans'
  },
  {
    filename: 'fitness-tracker.jpg',
    productTitle: 'Smart Fitness Tracker'
  },
  {
    filename: 'power-bank.jpg',
    productTitle: 'Portable Power Bank'
  },
  {
    filename: 'bluetooth-speaker.jpg',
    productTitle: 'Bluetooth Speaker'
  },
  {
    filename: 'honey.jpg',
    productTitle: 'Organic Honey'
  },
  {
    filename: 'bread.webp',
    productTitle: 'Artisan Bread Loaf'
  },
  {
    filename: 'pasta-sauce.jpg',
    productTitle: 'Gourmet Pasta Sauce'
  }
];

async function getPublicUrl(bucketName, fileName) {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return data.publicUrl;
}

async function findProductByTitle(title) {
  // Try multiple column names that might exist
  const { data, error } = await supabase
    .from('vendor_products')
    .select('*')
    .eq('title', title)
    .single();

  if (error) {
    console.warn(`Product "${title}" not found:`, error.message);
    return null;
  }

  console.log(`Found product: ${data.title} (ID: ${data.id})`);
  return data;
}

async function updateProductImage(productId, imageUrl) {
  // Based on our inspection, the table uses 'images' array and 'image_url' as the main image
  // Let's try updating the images array first
  try {
    // First try to update image_url (direct field)
    const { error: urlError } = await supabase
      .from('vendor_products')
      .update({ image_url: imageUrl })
      .eq('id', productId);

    if (!urlError) {
      console.log(`✅ Updated product image_url for ID: ${productId}`);
      return true;
    }

    console.log(`❌ image_url update failed:`, urlError.message);

    // If that fails, try updating the images array
    const { error: imagesError } = await supabase
      .from('vendor_products')
      .update({ images: [imageUrl] })
      .eq('id', productId);

    if (!imagesError) {
      console.log(`✅ Updated product images array for ID: ${productId}`);
      return true;
    }

    console.log(`❌ images array update failed:`, imagesError.message);

  } catch (error) {
    console.error(`❌ Unexpected error updating product ${productId}:`, error.message);
  }

  return false;
}

async function main() {
  console.log('🔗 Linking uploaded images to products...\n');

  let linkedCount = 0;
  let skippedCount = 0;

  for (const mapping of imageMapping) {
    const { filename, productTitle } = mapping;

    // Get the public URL for the uploaded image
    const imageUrl = getPublicUrl('product-images', filename);

    if (!imageUrl) {
      console.log(`⚠️  Could not generate public URL for ${filename}`);
      continue;
    }

    console.log(`🔗 Processing ${filename} for "${productTitle}"`);

    // Find the product
    const product = await findProductByTitle(productTitle);
    if (!product) {
      console.log(`⚠️  Product not found: ${productTitle}`);
      continue;
    }

    // Check if product already has an image
    if (product.image_url) {
      console.log(`⏭️  Product already has image: ${productTitle}`);
      skippedCount++;
      continue;
    }

    // Update the product with the image URL
    const updated = await updateProductImage(product.id, imageUrl);
    if (updated) {
      linkedCount++;
    }
  }

  console.log(`\n📊 Linking Summary:`);
  console.log(`   ✅ Images linked: ${linkedCount}`);
  console.log(`   ⏭️  Images skipped: ${skippedCount}`);
  console.log(`   📁 Total files processed: ${imageMapping.length}`);

  if (linkedCount > 0) {
    console.log('\n🎉 Product images linked successfully!');
    console.log('🌐 Check the marketplace to see products with images.');
  } else {
    console.log('\nℹ️  No new images were linked.');
  }
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});