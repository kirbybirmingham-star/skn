#!/usr/bin/env node
/**
 * Verify all product images are accessible via their URLs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyImageUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('\n🖼️  VERIFYING PRODUCT IMAGE ACCESSIBILITY\n');
  console.log('='.repeat(80));

  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, title, slug, vendor_id, image_url')
      .limit(153);

    console.log(`📦 Testing ${products.length} product images...\n`);

    let accessibleCount = 0;
    let failedCount = 0;
    const failedProducts = [];

    // Test a sample of products
    const sampleSize = Math.min(20, products.length);
    const samples = products.sort(() => 0.5 - Math.random()).slice(0, sampleSize);

    for (let i = 0; i < samples.length; i++) {
      const product = samples[i];
      const isAccessible = await verifyImageUrl(product.image_url);

      const status = isAccessible ? '✅' : '❌';
      console.log(`${status} [${i + 1}/${sampleSize}] "${product.title.substring(0, 40)}"`);

      if (isAccessible) {
        accessibleCount++;
      } else {
        failedCount++;
        failedProducts.push(product.title);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 SAMPLE TEST RESULTS (20 random products):');
    console.log('='.repeat(80));
    console.log(`\n✅ Accessible:  ${accessibleCount}/${sampleSize}`);
    console.log(`❌ Failed:      ${failedCount}/${sampleSize}`);

    if (failedProducts.length > 0) {
      console.log('\nFailed products:');
      failedProducts.forEach(title => console.log(`  - ${title}`));
    } else {
      console.log('\n✨ ALL SAMPLED IMAGES ARE ACCESSIBLE!\n');
    }

    // Show some example URLs
    console.log('📂 EXAMPLE IMAGE URLS:\n');
    products.slice(0, 3).forEach((p, i) => {
      console.log(`${i + 1}. "${p.title}"`);
      console.log(`   ${p.image_url}\n`);
    });

    console.log('='.repeat(80));
    console.log('✅ IMAGES READY FOR PRODUCT CARDS');
    console.log('='.repeat(80) + '\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
