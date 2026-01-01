#!/usr/bin/env node
/**
 * Check actual URLs of all products
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('📂 CURRENT PRODUCT IMAGE URLS');
  console.log('='.repeat(80) + '\n');

  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, title, image_url');

    // Group by URL pattern
    const byBucket = {};
    products?.forEach(p => {
      let bucket = 'other';
      if (p.image_url?.includes('product-images/')) bucket = 'product-images';
      else if (p.image_url?.includes('listings-images/vendors/')) bucket = 'listings-vendors';
      else if (p.image_url?.includes('listings-images/')) bucket = 'listings-other';
      
      byBucket[bucket] = (byBucket[bucket] || 0) + 1;
    });

    console.log('📊 DISTRIBUTION:\n');
    Object.entries(byBucket).forEach(([bucket, count]) => {
      console.log(`  ${bucket}: ${count} products`);
    });

    console.log('\n📋 SAMPLE URLS BY BUCKET:\n');
    
    // Show samples from each bucket
    products?.forEach(p => {
      if (p.image_url?.includes('listings-images/vendors/') && 
          !samples.listings) {
        samples.listings = p;
        console.log(`listings-images/vendors/`);
        const path = p.image_url.split('/storage/v1/object/public/')[1];
        console.log(`  ${path}\n`);
      }
      if (p.image_url?.includes('product-images/') && 
          !samples.product) {
        samples.product = p;
        console.log(`product-images/`);
        const path = p.image_url.split('/storage/v1/object/public/')[1];
        console.log(`  ${path}\n`);
      }
    });

    const samples = {};
    products?.slice(0, 5).forEach(p => {
      const bucket = p.image_url?.includes('product-images/') ? 'product-images' : 'listings';
      if (!samples[bucket]) {
        samples[bucket] = [];
      }
      samples[bucket].push(p);
    });

    console.log('📍 FIRST 2 PRODUCTS:\n');
    products?.slice(0, 2).forEach(p => {
      const path = p.image_url.split('/storage/v1/object/public/')[1];
      console.log(`"${p.title}"`);
      console.log(`  ${path}\n`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
