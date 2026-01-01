#!/usr/bin/env node

/**
 * Upload Sample Images Script
 * This script uploads sample product images to Supabase storage
 * and associates them with the existing products.
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

const sampleImages = [
  {
    filename: 'headphones.jpg',
    productTitle: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones for immersive audio experience'
  },
  {
    filename: 'coffee.jpg',
    productTitle: 'Organic Coffee Beans',
    description: 'Freshly roasted organic coffee beans from sustainable farms'
  },
  {
    filename: 'fitness-tracker.jpg',
    productTitle: 'Smart Fitness Tracker',
    description: 'Advanced fitness tracking device with heart rate monitoring'
  },
  {
    filename: 'power-bank.jpg',
    productTitle: 'Portable Power Bank',
    description: 'High-capacity portable charger for all your devices'
  },
  {
    filename: 'bluetooth-speaker.jpg',
    productTitle: 'Bluetooth Speaker',
    description: 'Portable Bluetooth speaker with excellent sound quality'
  },
  {
    filename: 'honey.jpg',
    productTitle: 'Organic Honey',
    description: 'Pure organic honey from local beekeepers'
  },
  {
    filename: 'bread.jpg',
    productTitle: 'Artisan Bread Loaf',
    description: 'Freshly baked artisan bread made with traditional methods'
  },
  {
    filename: 'pasta-sauce.jpg',
    productTitle: 'Gourmet Pasta Sauce',
    description: 'Authentic Italian pasta sauce made with premium ingredients'
  }
];

async function uploadImage(filePath, fileName, bucketName = 'product-images') {
  try {
    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      });

    if (error) {
      console.error(`Failed to upload ${fileName}:`, error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    console.log(`✅ Uploaded ${fileName}`);
    return publicUrl;
  } catch (error) {
    console.error(`Error uploading ${fileName}:`, error.message);
    return null;
  }
}

async function findProductByTitle(title) {
  const { data, error } = await supabase
    .from('vendor_products')
    .select('id, title, vendor_id')
    .eq('title', title)
    .single();

  if (error) {
    console.warn(`Product "${title}" not found:`, error.message);
    return null;
  }

  return data;
}

async function updateProductImage(productId, imageUrl) {
  const { error } = await supabase
    .from('vendor_products')
    .update({ image_url: imageUrl })
    .eq('id', productId);

  if (error) {
    console.error(`Failed to update product ${productId}:`, error.message);
    return false;
  }

  console.log(`✅ Updated product image for ID: ${productId}`);
  return true;
}

async function main() {
  console.log('🚀 Starting sample image upload process...\n');

  // Check if sample images directory exists
  const sampleImagesDir = path.join(__dirname, '../sample-images');

  if (!fs.existsSync(sampleImagesDir)) {
    console.log('📁 Creating sample images directory...');
    fs.mkdirSync(sampleImagesDir, { recursive: true });
    console.log('ℹ️  Sample images directory created. Please add your sample images here.');
    console.log('📝 Expected filenames:');

    sampleImages.forEach(img => {
      console.log(`   - ${img.filename} (${img.productTitle})`);
    });

    console.log('\n🛑 No sample images found. Please add images and run again.');
    process.exit(0);
  }

  // Check for existing images
  const existingFiles = fs.readdirSync(sampleImagesDir);
  console.log(`📂 Found ${existingFiles.length} files in sample-images directory`);

  let uploadedCount = 0;
  let skippedCount = 0;

  for (const imageInfo of sampleImages) {
    const { filename, productTitle, description } = imageInfo;
    const filePath = path.join(sampleImagesDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Sample image not found: ${filename} (${productTitle})`);
      continue;
    }

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

    // Upload the image
    const timestamp = Date.now();
    const storageFileName = `sample-${timestamp}-${filename}`;
    const imageUrl = await uploadImage(filePath, storageFileName);

    if (imageUrl) {
      // Update the product with the image URL
      const updated = await updateProductImage(product.id, imageUrl);
      if (updated) {
        uploadedCount++;
      }
    }
  }

  console.log(`\n📊 Upload Summary:`);
  console.log(`   ✅ Images uploaded: ${uploadedCount}`);
  console.log(`   ⏭️  Images skipped: ${skippedCount}`);
  console.log(`   📁 Total files processed: ${sampleImages.length}`);

  if (uploadedCount > 0) {
    console.log('\n🎉 Sample images uploaded successfully!');
    console.log('🌐 You can now view the marketplace with product images.');
  } else {
    console.log('\nℹ️  No new images were uploaded.');
  }

  console.log('\n💡 To add more sample images:');
  console.log('   1. Place your image files in the sample-images directory');
  console.log('   2. Update the sampleImages array in this script');
  console.log('   3. Run this script again');
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});