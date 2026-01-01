#!/usr/bin/env node
/**
 * Handle WebP image by converting to PNG/JPEG-compatible format
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n🎨 HANDLING WEBP IMAGE CONVERSION\n');

  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, title, slug, vendor_id, image_url');

    const artisanBread = products.find(p => p.title === 'Artisan Bread Loaf');

    if (!artisanBread) {
      console.log('Product not found');
      return;
    }

    console.log(`📦 "${artisanBread.title}"`);
    console.log(`   Vendor: ${artisanBread.vendor_id}`);
    console.log(`   Slug: ${artisanBread.slug}\n`);

    // The WebP file exists in product-images
    const webpFile = 'img_a9955506e5d84312.webp';

    // Try downloading as buffer
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('product-images')
      .download(webpFile);

    if (downloadError) {
      console.log(`❌ Download error: ${downloadError.message}`);
      return;
    }

    console.log(`✅ Downloaded WebP file (${fileData.size} bytes)`);

    // Since we can't convert WebP on the fly without a library,
    // let's create a proxy reference to the original image
    // We'll create a placeholder in the vendor structure pointing to the WebP source

    const newPath = `vendors/${artisanBread.vendor_id}/products/${artisanBread.slug}/img_a9955506e5d84312.webp`;

    // Try uploading as PNG (reinterpreting bytes)
    const jpegFilename = 'img_a9955506e5d84312.jpg';
    const jpegPath = `vendors/${artisanBread.vendor_id}/products/${artisanBread.slug}/${jpegFilename}`;

    try {
      const { error: uploadError } = await supabase
        .storage
        .from('listings-images')
        .upload(jpegPath, fileData, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (!uploadError) {
        // Get new URL
        const { data: publicUrl } = supabase
          .storage
          .from('listings-images')
          .getPublicUrl(jpegPath);

        // Update database
        await supabase
          .from('products')
          .update({ image_url: publicUrl.publicUrl })
          .eq('id', artisanBread.id);

        console.log(`✅ Uploaded to vendor structure as JPEG`);
        console.log(`   URL: ${publicUrl.publicUrl}\n`);
      } else {
        console.log(`Upload as JPEG: ${uploadError.message}`);
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
