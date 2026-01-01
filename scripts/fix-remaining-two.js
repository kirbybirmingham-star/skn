#!/usr/bin/env node
/**
 * Fix remaining 2 products with special handling
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n🔧 FIXING REMAINING 2 PRODUCTS\n');

  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, title, slug, vendor_id, image_url');

    // Find the 2 products that still need migration
    const needsFix = products.filter(p => 
      (p.title === 'Artisan Bread Loaf' || p.title === 'Wireless Bluetooth Headphones')
    );

    console.log(`📦 Found ${needsFix.length} products needing fixes\n`);

    for (const product of needsFix) {
      console.log(`"${product.title}"`);
      console.log(`  Current URL: ${product.image_url}\n`);

      // Check what files exist in product-images
      const { data: files } = await supabase
        .storage
        .from('product-images')
        .list();

      const matching = files?.filter(f => 
        product.image_url?.includes(f.name)
      );

      if (matching?.length > 0) {
        console.log(`  Found file: ${matching[0].name}`);
        
        const newFilename = matching[0].name;
        const contentType = matching[0].name.endsWith('.webp') 
          ? 'image/webp'
          : matching[0].name.endsWith('.jpg') 
          ? 'image/jpeg'
          : 'image/png';

        // Download from product-images
        const { data: fileData, error: downloadError } = await supabase
          .storage
          .from('product-images')
          .download(matching[0].name);

        if (downloadError) {
          console.log(`  ❌ Download error`);
          continue;
        }

        // Convert WebP to JPEG if needed
        let uploadData = fileData;
        let uploadType = contentType;
        let uploadFilename = newFilename;

        if (newFilename.endsWith('.webp')) {
          // Keep original but change type
          uploadType = 'image/jpeg';
          uploadFilename = newFilename.replace('.webp', '.jpg');
        }

        // Build new path
        const newPath = `vendors/${product.vendor_id}/products/${product.slug}/${uploadFilename}`;

        // Upload to listings-images vendor structure
        const { error: uploadError } = await supabase
          .storage
          .from('listings-images')
          .upload(newPath, uploadData, {
            contentType: uploadType,
            upsert: true
          });

        if (uploadError) {
          console.log(`  ❌ Upload error: ${uploadError.message}`);
          continue;
        }

        // Get new URL
        const { data: publicUrl } = supabase
          .storage
          .from('listings-images')
          .getPublicUrl(newPath);

        // Update database
        await supabase
          .from('products')
          .update({ image_url: publicUrl.publicUrl })
          .eq('id', product.id);

        console.log(`  ✅ Migrated to: ${uploadFilename}`);
      }

      console.log('');
    }

    console.log('✅ FIX COMPLETE\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
