#!/usr/bin/env node
/**
 * Batch migrate all product images from listings-images to product-images
 * with standardized naming: img_[product_id_short]_[timestamp].ext
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

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 BATCH IMAGE MIGRATION - ALL PRODUCTS');
  console.log('='.repeat(80) + '\n');

  const tempDir = './temp-migration';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // Get all products
    console.log('📦 Fetching all products...\n');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, image_url');

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }

    console.log(`Found ${products?.length || 0} products\n`);

    // Filter to only those with URLs (to avoid errors)
    const productsWithImages = products?.filter(p => p.image_url) || [];
    console.log(`${productsWithImages.length} have image_url values\n`);

    let successCount = 0;
    let failCount = 0;
    const updates = [];

    // Process products in batches
    for (let i = 0; i < productsWithImages.length; i++) {
      const product = productsWithImages[i];
      const progress = `[${i + 1}/${productsWithImages.length}]`;

      try {
        console.log(`${progress} Processing: "${product.title}"`);

        // Download image
        const filename = path.basename(product.image_url);
        const filepath = path.join(tempDir, filename);
        
        try {
          await downloadFile(product.image_url, filepath);
        } catch (downloadErr) {
          console.log(`  ⚠️  Download failed, skipping: ${downloadErr.message}`);
          failCount++;
          continue;
        }

        // Read file
        const fileBuffer = fs.readFileSync(filepath);
        const fileExt = path.extname(filename) || '.jpg';

        // Generate new filename
        const timestamp = Date.now() + Math.random();
        const newFilename = `img_${product.id.substring(0, 8)}_${Math.floor(timestamp)}${fileExt}`;

        // Upload to product-images
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('product-images')
          .upload(newFilename, fileBuffer, {
            contentType: `image/${fileExt.replace('.', '')}`,
            upsert: false
          });

        if (uploadError) {
          console.log(`  ❌ Upload failed: ${uploadError.message}`);
          failCount++;
          continue;
        }

        // Get public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('product-images')
          .getPublicUrl(newFilename);

        // Store update for batch
        updates.push({
          id: product.id,
          image_url: publicUrlData.publicUrl
        });

        console.log(`  ✅ Uploaded: ${newFilename}`);
        successCount++;

        // Cleanup
        fs.unlinkSync(filepath);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
        failCount++;
      }
    }

    // Batch update all products
    console.log(`\n📝 UPDATING ${updates.length} PRODUCTS IN DATABASE...\n`);

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: update.image_url })
        .eq('id', update.id);

      if (updateError) {
        console.log(`❌ Failed to update product ${update.id}: ${updateError.message}`);
      }
    }

    // Cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    console.log('\n' + '='.repeat(80));
    console.log('✅ MIGRATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nSuccessfully migrated: ${successCount} products`);
    console.log(`Failed: ${failCount} products`);
    console.log(`Total processed: ${successCount + failCount}\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

// Run with confirmation
console.log('⚠️  THIS WILL MIGRATE ALL 150+ PRODUCT IMAGES');
console.log('Starting migration in 3 seconds...\n');

setTimeout(() => {
  main();
}, 3000);
