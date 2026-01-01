#!/usr/bin/env node
/**
 * Move product images from flat structure to vendor folder structure
 * FROM: listings-images/[product_slug]/img_[id]_[timestamp].jpg
 * TO:   listings-images/vendors/[vendor_id]/products/[product_slug]/img_[id]_[timestamp].jpg
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 MOVE IMAGES TO VENDOR FOLDER STRUCTURE');
  console.log('FROM: listings-images/[product_slug]/img_...jpg');
  console.log('TO:   listings-images/vendors/[vendor_id]/products/[product_slug]/img_...jpg');
  console.log('='.repeat(80) + '\n');

  try {
    // Get products with their vendors
    const { data: products } = await supabase
      .from('products')
      .select('id, slug, image_url, vendor_id');

    console.log(`📦 Found ${products?.length} products\n`);

    let successCount = 0;
    let failCount = 0;
    const updates = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const progress = `[${i + 1}/${products.length}]`;

      try {
        // Check if already in vendor structure
        if (product.image_url?.includes('vendors/')) {
          continue;
        }

        if (!product.image_url?.includes('listings-images/')) {
          continue;
        }

        console.log(`${progress} Moving product`);

        // Parse current path
        const pathMatch = product.image_url.match(/listings-images\/([^/]+)\/(.+)$/);
        if (!pathMatch) {
          failCount++;
          continue;
        }

        const filename = pathMatch[2];

        // Build new path
        const newPath = `vendors/${product.vendor_id}/products/${product.slug}/${filename}`;

        // Download old file
        const { data: fileData, error: downloadError } = await supabase
          .storage
          .from('listings-images')
          .download(`${pathMatch[1]}/${filename}`);

        if (downloadError) {
          console.log(`  ❌ Download failed`);
          failCount++;
          continue;
        }

        // Upload to new location
        const { error: uploadError } = await supabase
          .storage
          .from('listings-images')
          .upload(newPath, fileData, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          console.log(`  ⚠️  Upload failed: ${uploadError.message}`);
          failCount++;
          continue;
        }

        // Delete old file
        await supabase.storage.from('listings-images').remove([`${pathMatch[1]}/${filename}`]);

        // Get new URL
        const { data: publicUrl } = supabase
          .storage
          .from('listings-images')
          .getPublicUrl(newPath);

        updates.push({
          id: product.id,
          image_url: publicUrl.publicUrl
        });

        console.log(`  ✅ Moved to vendor folder`);
        successCount++;

        await new Promise(r => setTimeout(r, 50));

      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
        failCount++;
      }
    }

    // Update database
    console.log(`\n📝 UPDATING ${updates.length} PRODUCTS...\n`);

    for (const update of updates) {
      await supabase
        .from('products')
        .update({ image_url: update.image_url })
        .eq('id', update.id);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ MIGRATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nMoved:   ${successCount} products`);
    console.log(`Failed:  ${failCount} products\n`);

    console.log('📂 NEW STRUCTURE:');
    console.log('   listings-images/');
    console.log('   └── vendors/');
    console.log('       └── [vendor_id]/');
    console.log('           └── products/');
    console.log('               └── [product_slug]/');
    console.log('                   ├── img_[id]_[timestamp].jpg');
    console.log('                   └── variants/\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
