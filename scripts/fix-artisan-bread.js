#!/usr/bin/env node
/**
 * Fix Artisan Bread Loaf - use a fallback or placeholder
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n🍞 FIXING ARTISAN BREAD LOAF IMAGE\n');

  try {
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('title', 'Artisan Bread Loaf')
      .single();

    console.log(`Product: "${product.title}"`);
    console.log(`Vendor: ${product.vendor_id}`);
    console.log(`Slug: ${product.slug}\n`);

    // Check what files exist in vendor structure
    const { data: files } = await supabase
      .storage
      .from('listings-images')
      .list(`vendors/${product.vendor_id}/products/${product.slug}`);

    console.log('Files in vendor folder:');
    if (files && files.length > 0) {
      files.forEach(f => console.log(`  - ${f.name}`));
      
      // Use the first image file found
      const imageFile = files.find(f => f.name.match(/\.(jpg|jpeg|png|gif)$/i));
      if (imageFile) {
        const newUrl = `https://tmyxjsqhtxnuchmekbpt.supabase.co/storage/v1/object/public/listings-images/vendors/${product.vendor_id}/products/${product.slug}/${imageFile.name}`;
        
        await supabase
          .from('products')
          .update({ image_url: newUrl })
          .eq('id', product.id);
        
        console.log(`\n✅ Updated to use: ${imageFile.name}`);
      } else {
        // No suitable image, use placeholder
        console.log('\n⚠️  No suitable image format found, using placeholder');
        const placeholderUrl = `https://tmyxjsqhtxnuchmekbpt.supabase.co/storage/v1/object/public/listings-images/vendors/${product.vendor_id}/products/${product.slug}/img_default.jpg`;
        
        await supabase
          .from('products')
          .update({ image_url: placeholderUrl })
          .eq('id', product.id);
      }
    } else {
      console.log('  (empty - will use placeholder)\n');
      const placeholderUrl = `https://tmyxjsqhtxnuchmekbpt.supabase.co/storage/v1/object/public/listings-images/vendors/${product.vendor_id}/products/${product.slug}/img_default.jpg`;
      
      await supabase
        .from('products')
        .update({ image_url: placeholderUrl })
        .eq('id', product.id);
    }

    console.log('\n✨ FIXED\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
