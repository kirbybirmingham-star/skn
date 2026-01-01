#!/usr/bin/env node
/**
 * Reorganize images from listings-images/vendors/[id]/products/[slug]/main.jpg
 * TO: listings-images/vendors/[id]/products/[slug]/img_[id]_[timestamp].jpg
 * AND create variants subdirectory
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🗂️  RENAME IMAGES IN VENDOR FOLDERS');
  console.log('FROM: vendors/[id]/products/[slug]/main.jpg');
  console.log('TO:   vendors/[id]/products/[slug]/img_[id]_[timestamp].jpg');
  console.log('='.repeat(80) + '\n');

  try {
    // Get all products
    const { data: products } = await supabase
      .from('products')
      .select('id, title, image_url');

    console.log(`📦 Found ${products?.length || 0} products\n`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    const updates = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const progress = `[${i + 1}/${products.length}]`;

      // Skip if already has new format
      if (product.image_url?.includes('img_')) {
        skipCount++;
        continue;
      }

      if (!product.image_url?.includes('vendors/')) {
        console.log(`${progress} ⚠️  "${product.title}" - Not in vendor folder`);
        skipCount++;
        continue;
      }

      try {
        console.log(`${progress} "${product.title}"`);

        // Parse URL to extract vendor, product slug
        const urlMatch = product.image_url.match(/vendors\/([^/]+)\/products\/([^/]+)\//);
        if (!urlMatch) {
          console.log(`  ❌ Could not parse URL`);
          failCount++;
          continue;
        }

        const vendorId = urlMatch[1];
        const productSlug = urlMatch[2];
        const oldPath = `vendors/${vendorId}/products/${productSlug}/main.jpg`;
        const fileExt = '.jpg';
        const timestamp = Date.now() + i;
        const newFilename = `img_${product.id.substring(0, 8)}_${timestamp}${fileExt}`;
        const newPath = `vendors/${vendorId}/products/${productSlug}/${newFilename}`;

        // Download old file
        const { data: fileData, error: downloadError } = await supabase
          .storage
          .from('listings-images')
          .download(oldPath);

        if (downloadError) {
          console.log(`  ⚠️  Could not download: ${downloadError.message}`);
          failCount++;
          continue;
        }

        // Upload with new name
        const { error: uploadError } = await supabase
          .storage
          .from('listings-images')
          .upload(newPath, fileData, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          console.log(`  ❌ Upload failed: ${uploadError.message}`);
          failCount++;
          continue;
        }

        // Delete old file
        const { error: deleteError } = await supabase
          .storage
          .from('listings-images')
          .remove([oldPath]);

        if (deleteError) {
          console.log(`  ⚠️  Could not delete old file: ${deleteError.message}`);
        }

        // Get new public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('listings-images')
          .getPublicUrl(newPath);

        // Store update
        updates.push({
          id: product.id,
          image_url: publicUrlData.publicUrl
        });

        console.log(`  ✅ Renamed to: ${newFilename}`);
        successCount++;

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100));

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
        console.log(`  ❌ Failed to update ${update.id}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ REORGANIZATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nRenamed:   ${successCount} products`);
    console.log(`Skipped:   ${skipCount} products`);
    console.log(`Failed:    ${failCount} products\n`);

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
