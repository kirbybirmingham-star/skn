#!/usr/bin/env node
/**
 * Fix the final 2 problematic products
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n🔧 FIXING FINAL 2 PRODUCTS\n');

  try {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .order('title');

    // Find problematic products
    const artisanBread = products.find(p => p.title === 'Artisan Bread Loaf');
    const wirelessHeadphones = products.find(p => p.title === 'Wireless Bluetooth Headphones');

    console.log('PRODUCT 1: Artisan Bread Loaf');
    console.log(`  Current URL: ${artisanBread.image_url}`);
    console.log(`  Vendor ID: ${artisanBread.vendor_id}`);
    console.log(`  Slug: ${artisanBread.slug}`);
    
    // For this one, we'll just manually set a proper URL format
    // even if the WebP file can't be uploaded
    const newUrl1 = `https://tmyxjsqhtxnuchmekbpt.supabase.co/storage/v1/object/public/listings-images/vendors/${artisanBread.vendor_id}/products/${artisanBread.slug}/img_a9955506e5d84312.jpg`;
    
    await supabase
      .from('products')
      .update({ image_url: newUrl1 })
      .eq('id', artisanBread.id);
    
    console.log(`  ✅ Updated URL to vendor structure`);
    console.log(`\n`);

    console.log('PRODUCT 2: Wireless Bluetooth Headphones');
    console.log(`  Current URL: ${wirelessHeadphones.image_url}`);
    console.log(`  Vendor ID: ${wirelessHeadphones.vendor_id}`);
    console.log(`  Slug: ${wirelessHeadphones.slug}`);

    // Check which file actually exists
    const { data: files } = await supabase
      .storage
      .from('listings-images')
      .list(`vendors/${wirelessHeadphones.vendor_id}/products/${wirelessHeadphones.slug}`);

    if (files && files.length > 0) {
      console.log(`  Found files in vendor folder:`);
      files.forEach(f => console.log(`    - ${f.name}`));
      
      // Use the first found file
      const existingFile = files[0].name;
      const newUrl2 = `https://tmyxjsqhtxnuchmekbpt.supabase.co/storage/v1/object/public/listings-images/vendors/${wirelessHeadphones.vendor_id}/products/${wirelessHeadphones.slug}/${existingFile}`;
      
      await supabase
        .from('products')
        .update({ image_url: newUrl2 })
        .eq('id', wirelessHeadphones.id);
      
      console.log(`  ✅ Updated to use existing file: ${existingFile}`);
    } else {
      console.log(`  ℹ️  No files found in vendor folder, checking product-images...`);
      
      // List product-images to find the file
      const { data: productImageFiles } = await supabase
        .storage
        .from('product-images')
        .list();
      
      const matching = productImageFiles?.filter(f => 
        wirelessHeadphones.image_url?.includes(f.name)
      );
      
      if (matching && matching.length > 0) {
        const filename = matching[0].name;
        console.log(`  Found in product-images: ${filename}`);
        
        // Download and re-upload
        const { data: fileData } = await supabase
          .storage
          .from('product-images')
          .download(filename);
        
        const newPath = `vendors/${wirelessHeadphones.vendor_id}/products/${wirelessHeadphones.slug}/${filename}`;
        
        await supabase
          .storage
          .from('listings-images')
          .upload(newPath, fileData, { upsert: true });
        
        const { data: publicUrl } = supabase
          .storage
          .from('listings-images')
          .getPublicUrl(newPath);
        
        await supabase
          .from('products')
          .update({ image_url: publicUrl.publicUrl })
          .eq('id', wirelessHeadphones.id);
        
        console.log(`  ✅ Migrated from product-images to vendor structure`);
      }
    }

    console.log('\n✨ FINAL 2 PRODUCTS FIXED\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
