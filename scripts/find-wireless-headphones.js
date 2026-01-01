#!/usr/bin/env node
/**
 * Find and fix all "Wireless Bluetooth Headphones" products
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n🔍 FINDING ALL WIRELESS BLUETOOTH HEADPHONES\n');

  try {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .ilike('title', '%wireless%bluetooth%headphones%');

    console.log(`Found ${products.length} products:\n`);

    for (const product of products) {
      console.log(`📱 "${product.title}"`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Vendor: ${product.vendor_id}`);
      console.log(`   Slug: ${product.slug}`);
      console.log(`   URL Type: ${
        product.image_url?.includes('vendors/') ? '✅ VENDOR' :
        product.image_url?.includes('listings-images/') ? '⚠️  FLAT' :
        product.image_url?.includes('product-images/') ? '🔴 PRODUCT-IMAGES' :
        '❌ OTHER'
      }`);
      console.log(`   URL: ${product.image_url}\n`);

      // Fix if needed
      if (!product.image_url?.includes('vendors/')) {
        const newUrl = `https://tmyxjsqhtxnuchmekbpt.supabase.co/storage/v1/object/public/listings-images/vendors/${product.vendor_id}/products/${product.slug}/img_default.jpg`;
        
        await supabase
          .from('products')
          .update({ image_url: newUrl })
          .eq('id', product.id);
        
        console.log(`   ✅ Fixed URL\n`);
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
