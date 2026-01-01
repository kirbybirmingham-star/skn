#!/usr/bin/env node
/**
 * Script to test image upload/download workflow
 * 1. Download an existing image from listings-images
 * 2. Upload to product-images with proper naming
 * 3. Verify file structure and update product reference
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to download file from URL
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded to: ${filepath}`);
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🖼️  IMAGE UPLOAD STRUCTURE TEST');
  console.log('='.repeat(80) + '\n');

  const tempDir = './temp-images';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // Get a product with an image from listings-images
    console.log('📦 Finding product with image...\n');
    const { data: products } = await supabase
      .from('products')
      .select('id, title, image_url')
      .limit(1);

    const product = products?.[0];
    if (!product || !product.image_url) {
      console.error('❌ No products with images found');
      return;
    }

    console.log(`Found: "${product.title}"`);
    console.log(`Original URL: ${product.image_url}\n`);

    // Download the image
    console.log('⬇️  DOWNLOADING IMAGE...\n');
    const filename = path.basename(product.image_url);
    const filepath = path.join(tempDir, filename);
    
    try {
      await downloadFile(product.image_url, filepath);
    } catch (err) {
      console.error('❌ Download failed:', err.message);
      console.log('⚠️  Using file size check instead\n');
    }

    // Check file size
    const fileSize = fs.statSync(filepath).size;
    console.log(`📊 File size: ${fileSize} bytes\n`);

    // Upload to product-images bucket
    console.log('⬆️  UPLOADING TO PRODUCT-IMAGES BUCKET...\n');

    // Create a standardized filename
    const timestamp = Date.now();
    const newFilename = `img_${product.id.substring(0, 8)}_${timestamp}.jpg`;
    
    const fileBuffer = fs.readFileSync(filepath);
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('product-images')
      .upload(newFilename, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return;
    }

    console.log(`✅ Uploaded: ${newFilename}`);
    console.log(`   Path: product-images/${newFilename}\n`);

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('product-images')
      .getPublicUrl(newFilename);

    console.log(`📍 PUBLIC URL:`);
    console.log(`   ${publicUrlData.publicUrl}\n`);

    // List files in product-images to show structure
    console.log('📂 CHECKING PRODUCT-IMAGES BUCKET STRUCTURE...\n');
    const { data: files, error: listError } = await supabase
      .storage
      .from('product-images')
      .list('', { limit: 15 });

    if (listError) {
      console.error('❌ List error:', listError);
    } else {
      console.log(`Found ${files?.length || 0} files:`);
      files?.forEach(f => {
        console.log(`  - ${f.name} (${f.metadata?.size || 'unknown'} bytes)`);
      });
    }

    // Update product in database
    console.log(`\n🔄 UPDATING PRODUCT RECORD...\n`);
    const { data: updateData, error: updateError } = await supabase
      .from('products')
      .update({
        image_url: publicUrlData.publicUrl
      })
      .eq('id', product.id)
      .select();

    if (updateError) {
      console.error('❌ Update error:', updateError);
    } else {
      console.log(`✅ Updated product "${product.title}"`);
      console.log(`   Old URL: ${product.image_url}`);
      console.log(`   New URL: ${publicUrlData.publicUrl}\n`);
    }

    // Verify the update
    console.log('✔️  VERIFICATION...\n');
    const { data: verifyData } = await supabase
      .from('products')
      .select('id, title, image_url')
      .eq('id', product.id)
      .single();

    console.log(`Product: "${verifyData.title}"`);
    console.log(`Image URL: ${verifyData.image_url}`);
    console.log(`✅ Matches new URL: ${verifyData.image_url === publicUrlData.publicUrl}\n`);

    // Cleanup
    fs.unlinkSync(filepath);
    console.log('🧹 Cleaned up temp files\n');

    console.log('='.repeat(80));
    console.log('📋 IMAGE STORAGE STRUCTURE ESTABLISHED');
    console.log('='.repeat(80));
    console.log(`\nFile naming pattern: img_[product_id_short]_[timestamp].[ext]`);
    console.log(`Bucket: product-images`);
    console.log(`Access: Public (via getPublicUrl)`);
    console.log(`Database field: image_url (stores full public URL)\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
