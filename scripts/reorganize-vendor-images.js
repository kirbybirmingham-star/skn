#!/usr/bin/env node
/**
 * Reorganize product images maintaining vendor folder structure
 * FROM: listings-images/vendors/[vendor_id]/products/[product_slug]/main.jpg
 * TO:   listings-images/vendors/[vendor_id]/products/[product_slug]/img_[id]_[timestamp].jpg
 * 
 * Also creates structure for variants:
 *       listings-images/vendors/[vendor_id]/products/[product_slug]/variants/
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

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

function extractPathInfo(imageUrl) {
  try {
    // Parse URL like: https://...storage/v1/object/public/listings-images/vendors/[vendor]/products/[slug]/main.jpg
    const pathMatch = imageUrl.match(/listings-images\/vendors\/([^/]+)\/products\/([^/]+)\//);
    if (!pathMatch) return null;

    return {
      vendorId: pathMatch[1],
      productSlug: pathMatch[2]
    };
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🗂️  REORGANIZE IMAGES WITH VENDOR STRUCTURE');
  console.log('='.repeat(80) + '\n');

  const tempDir = './temp-vendor-migration';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // Get all products with listings-images
    console.log('📦 Fetching products...\n');
    const { data: products } = await supabase
      .from('products')
      .select('id, title, image_url');

    const listingsImageProducts = products?.filter(p => 
      p.image_url?.includes('listings-images/vendors')
    ) || [];

    console.log(`Found ${listingsImageProducts.length} products using listings-images\n`);

    let successCount = 0;
    let failCount = 0;
    const updates = [];

    // Process each product
    for (let i = 0; i < listingsImageProducts.length; i++) {
      const product = listingsImageProducts[i];
      const progress = `[${i + 1}/${listingsImageProducts.length}]`;

      try {
        console.log(`${progress} "${product.title}"`);

        // Extract path info
        const pathInfo = extractPathInfo(product.image_url);
        if (!pathInfo) {
          console.log(`  ⚠️  Could not parse path, skipping`);
          failCount++;
          continue;
        }

        const { vendorId, productSlug } = pathInfo;
        console.log(`  Vendor: ${vendorId.substring(0, 8)}...`);
        console.log(`  Product: ${productSlug}`);

        // Download image
        const filename = path.basename(product.image_url);
        const filepath = path.join(tempDir, filename);
        
        try {
          await downloadFile(product.image_url, filepath);
        } catch (downloadErr) {
          console.log(`  ❌ Download failed: ${downloadErr.message}`);
          failCount++;
          continue;
        }

        // Read file
        const fileBuffer = fs.readFileSync(filepath);
        const fileExt = path.extname(filename) || '.jpg';
        const mimeType = fileExt === '.webp' ? 'image/webp' : 'image/jpeg';

        // Generate new filename with ID and timestamp
        const timestamp = Date.now() + Math.floor(Math.random() * 1000);
        const newFilename = `img_${product.id.substring(0, 8)}_${timestamp}${fileExt}`;

        // Build new path: vendors/[vendor_id]/products/[product_slug]/[filename]
        const newPath = `vendors/${vendorId}/products/${productSlug}/${newFilename}`;

        // Upload to listings-images bucket
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('listings-images')
          .upload(newPath, fileBuffer, {
            contentType: mimeType,
            upsert: false
          });

        if (uploadError) {
          console.log(`  ❌ Upload failed: ${uploadError.message}`);
          failCount++;
          fs.unlinkSync(filepath);
          continue;
        }

        // Get public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('listings-images')
          .getPublicUrl(newPath);

        const newImageUrl = publicUrlData.publicUrl;

        // Store update
        updates.push({
          id: product.id,
          image_url: newImageUrl
        });

        console.log(`  ✅ Moved to: ${newFilename}`);
        successCount++;

        // Cleanup
        fs.unlinkSync(filepath);

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
        failCount++;
      }
    }

    // Batch update products
    console.log(`\n📝 UPDATING ${updates.length} PRODUCTS...\n`);

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: update.image_url })
        .eq('id', update.id);

      if (updateError) {
        console.log(`❌ Failed to update ${update.id}: ${updateError.message}`);
      }
    }

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

    console.log('\n' + '='.repeat(80));
    console.log('✅ REORGANIZATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nSuccessfully reorganized: ${successCount} products`);
    console.log(`Failed: ${failCount} products\n`);

    console.log('📂 NEW STRUCTURE:');
    console.log('   listings-images/');
    console.log('   └── vendors/');
    console.log('       └── [vendor_id]/');
    console.log('           └── products/');
    console.log('               └── [product_slug]/');
    console.log('                   ├── img_[id]_[timestamp].jpg  (main image)');
    console.log('                   └── variants/  (for variant images)\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
