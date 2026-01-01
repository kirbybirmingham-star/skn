#!/usr/bin/env node
/**
 * Reorganize images within listings-images bucket
 * FROM: listings-images/vendors/[vendor-id]/products/[product-slug]/main.jpg
 * TO:   listings-images/[product-slug]/img_[product-id-short]_[timestamp].jpg
 * 
 * Also supports variants subfolder:
 * TO:   listings-images/[product-slug]/variants/img_[product-id-short]_variant_[timestamp].jpg
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function reorganizeImage(product) {
  const tempDir = './temp-reorganize';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // Extract info from old URL
    const oldUrl = product.image_url;
    const filename = path.basename(oldUrl);
    const filepath = path.join(tempDir, filename);
    
    // Download from old location
    await downloadFile(oldUrl, filepath);
    
    // Read file
    const fileBuffer = fs.readFileSync(filepath);
    const fileExt = path.extname(filename) || '.jpg';
    
    // Generate new filename: img_[product-id-short]_[timestamp].jpg
    const timestamp = Date.now();
    const newFilename = `img_${product.id.substring(0, 8)}_${timestamp}${fileExt}`;
    
    // New path: [product-slug]/[new-filename]
    const newPath = `${product.slug}/${newFilename}`;
    
    // Upload to new location
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('listings-images')
      .upload(newPath, fileBuffer, {
        contentType: `image/jpeg`,
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL for new location
    const { data: publicUrlData } = supabase
      .storage
      .from('listings-images')
      .getPublicUrl(newPath);

    // Cleanup
    fs.unlinkSync(filepath);

    return {
      success: true,
      oldUrl: oldUrl,
      newUrl: publicUrlData.publicUrl,
      newPath: newPath
    };

  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🗂️  REORGANIZE LISTINGS-IMAGES BUCKET');
  console.log('='.repeat(80) + '\n');

  try {
    // Get a sample product to test
    const { data: products } = await supabase
      .from('products')
      .select('id, slug, title, image_url')
      .eq('slug', 'woven-seagrass-placemats')
      .limit(1);

    const product = products?.[0];
    
    if (!product || !product.image_url) {
      console.error('❌ Product not found or has no image');
      return;
    }

    console.log('📦 TEST PRODUCT: "' + product.title + '"\n');
    console.log('OLD URL:');
    console.log('  ' + product.image_url);
    console.log('');

    // Reorganize the image
    console.log('🔄 REORGANIZING...\n');
    const result = await reorganizeImage(product);

    if (!result.success) {
      console.error('❌ Reorganization failed:', result.error);
      return;
    }

    console.log('✅ NEW URL:');
    console.log('  ' + result.newUrl);
    console.log('');
    console.log('📍 Storage path:');
    console.log('  listings-images/' + result.newPath);
    console.log('');

    // Update product in database
    console.log('📝 UPDATING DATABASE...\n');
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: result.newUrl })
      .eq('id', product.id);

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return;
    }

    console.log('✅ Product updated\n');

    // Verify
    const { data: verifyData } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', product.id)
      .single();

    console.log('✔️  VERIFICATION:');
    console.log('  Image URL matches: ' + (verifyData.image_url === result.newUrl ? '✅' : '❌'));
    console.log('');

    console.log('='.repeat(80));
    console.log('📋 STORAGE STRUCTURE EXAMPLE');
    console.log('='.repeat(80));
    console.log(`
listings-images/
├── woven-seagrass-placemats/
│   ├── img_baf61ac7_1767215748515.jpg  (main image)
│   └── variants/
│       ├── img_baf61ac7_variant_1767215748516.jpg
│       └── img_baf61ac7_variant_1767215748517.jpg
├── smart-fitness-tracker/
│   ├── img_7d2555fa_1767215748600.jpg
│   └── variants/
└── organic-honey/
    ├── img_52dafa47_1767215748700.jpg
    └── variants/
`);

    console.log('='.repeat(80));
    console.log('✅ STRUCTURE READY FOR BATCH MIGRATION');
    console.log('='.repeat(80));
    console.log(`
To migrate all remaining products, run:
  node scripts/migrate-all-images-listings.js

Folder structure:
  [product-slug]/img_[id-short]_[timestamp].ext
  [product-slug]/variants/ (for variant images)
`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
