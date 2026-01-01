#!/usr/bin/env node
/**
 * Migrate remaining products to vendor folder structure
 * - 8 from product-images/
 * - 1 from listings-images/ flat
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n🚀 MIGRATING REMAINING 9 PRODUCTS TO VENDOR STRUCTURE\n');

  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, title, slug, vendor_id, image_url');

    const needsMigration = products.filter(p => 
      p.image_url?.includes('product-images/') || 
      (p.image_url?.includes('listings-images/') && !p.image_url?.includes('vendors/'))
    );

    console.log(`📦 Found ${needsMigration.length} products to migrate\n`);

    let successCount = 0;
    let failCount = 0;
    const updates = [];

    for (let i = 0; i < needsMigration.length; i++) {
      const product = needsMigration[i];
      const progress = `[${i + 1}/${needsMigration.length}]`;

      console.log(`${progress} "${product.title}"`);

      try {
        // Extract filename and determine source bucket
        let sourceUrl;
        let filename;
        let sourceBucket;

        if (product.image_url.includes('product-images/')) {
          sourceUrl = product.image_url;
          filename = sourceUrl.split('/').pop();
          sourceBucket = 'product-images';
        } else {
          sourceUrl = product.image_url;
          const pathMatch = sourceUrl.match(/listings-images\/([^/]+)/);
          filename = sourceUrl.split('/').pop();
          sourceBucket = 'listings-images';
        }

        // Download from source
        const { data: fileData, error: downloadError } = await supabase
          .storage
          .from(sourceBucket)
          .download(sourceUrl.split('/').slice(-1)[0]);

        if (downloadError) {
          console.log(`    ❌ Download failed: ${downloadError.message}`);
          failCount++;
          continue;
        }

        // Build new path in vendor structure
        const newPath = `vendors/${product.vendor_id}/products/${product.slug}/${filename}`;

        // Upload to vendor structure
        const { error: uploadError } = await supabase
          .storage
          .from('listings-images')
          .upload(newPath, fileData, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          console.log(`    ❌ Upload failed: ${uploadError.message}`);
          failCount++;
          continue;
        }

        // Get new URL
        const { data: publicUrl } = supabase
          .storage
          .from('listings-images')
          .getPublicUrl(newPath);

        updates.push({
          id: product.id,
          image_url: publicUrl.publicUrl
        });

        console.log(`    ✅ Moved to vendor structure`);
        successCount++;

        await new Promise(r => setTimeout(r, 100));

      } catch (err) {
        console.log(`    ❌ Error: ${err.message}`);
        failCount++;
      }
    }

    // Update database
    if (updates.length > 0) {
      console.log(`\n📝 UPDATING ${updates.length} PRODUCTS IN DATABASE...\n`);

      for (const update of updates) {
        await supabase
          .from('products')
          .update({ image_url: update.image_url })
          .eq('id', update.id);
        console.log(`    ✅ Updated: ${update.image_url.split('/').slice(-1)[0]}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ MIGRATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nMigrated: ${successCount} products`);
    console.log(`Failed:   ${failCount} products\n`);

    console.log('📂 ALL IMAGES NOW IN STRUCTURE:');
    console.log('   listings-images/vendors/[vendor_id]/products/[slug]/img_[id].jpg\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
