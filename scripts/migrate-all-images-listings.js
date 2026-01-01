#!/usr/bin/env node
/**
 * Batch reorganize ALL product images in listings-images bucket
 * FROM: listings-images/vendors/[vendor-id]/products/[product-slug]/main.jpg
 * TO:   listings-images/[product-slug]/img_[product-id-short]_[timestamp].jpg
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

async function reorganizeImage(product, tempDir) {
  try {
    const oldUrl = product.image_url;
    const filename = path.basename(oldUrl);
    const filepath = path.join(tempDir, filename);
    
    // Download from old location
    await downloadFile(oldUrl, filepath);
    
    // Read file
    const fileBuffer = fs.readFileSync(filepath);
    
    // Generate new filename and path
    const timestamp = Date.now();
    const newFilename = `img_${product.id.substring(0, 8)}_${timestamp}.jpg`;
    const newPath = `${product.slug}/${newFilename}`;
    
    // Upload to new location
    const { error: uploadError } = await supabase
      .storage
      .from('listings-images')
      .upload(newPath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('listings-images')
      .getPublicUrl(newPath);

    // Cleanup
    fs.unlinkSync(filepath);

    return {
      success: true,
      newUrl: publicUrlData.publicUrl
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
  console.log('🚀 BATCH REORGANIZE ALL PRODUCT IMAGES');
  console.log('='.repeat(80) + '\n');

  const tempDir = './temp-batch-reorganize';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // Get all products with old path structure
    console.log('📦 Fetching products...\n');
    const { data: products } = await supabase
      .from('products')
      .select('id, slug, title, image_url');

    const oldPathProducts = products?.filter(p => 
      p.image_url && p.image_url.includes('listings-images/vendors')
    ) || [];

    console.log(`Found ${oldPathProducts.length} products with old path structure\n`);

    if (oldPathProducts.length === 0) {
      console.log('✅ All products already reorganized!\n');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Process each product
    for (let i = 0; i < oldPathProducts.length; i++) {
      const product = oldPathProducts[i];
      const progress = `[${i + 1}/${oldPathProducts.length}]`;

      try {
        process.stdout.write(`${progress} "${product.title}"... `);

        const result = await reorganizeImage(product, tempDir);

        if (result.success) {
          // Update database
          const { error: updateError } = await supabase
            .from('products')
            .update({ image_url: result.newUrl })
            .eq('id', product.id);

          if (updateError) {
            console.log(`❌ DB update failed`);
            failCount++;
          } else {
            console.log(`✅`);
            successCount++;
          }
        } else {
          console.log(`❌ ${result.error}`);
          failCount++;
        }

        // Small delay
        await new Promise(r => setTimeout(r, 100));

      } catch (err) {
        console.log(`❌ ${err.message}`);
        failCount++;
      }
    }

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

    console.log('\n' + '='.repeat(80));
    console.log('✅ MIGRATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nSuccessfully reorganized: ${successCount} products`);
    console.log(`Failed: ${failCount} products`);
    console.log(`Total: ${successCount + failCount}\n`);

    // Show new structure
    console.log('📂 NEW STORAGE STRUCTURE:');
    console.log(`listings-images/
├── woven-seagrass-placemats/
│   ├── img_baf61ac7_....jpg
│   └── variants/ (for future variants)
├── smart-fitness-tracker/
│   ├── img_7d2555fa_....jpg
│   └── variants/
└── [product-slug]/
    ├── img_[id-short]_[timestamp].jpg
    └── variants/\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

console.log('⚠️  Starting migration in 2 seconds...\n');
setTimeout(() => main(), 2000);
