#!/usr/bin/env node
/**
 * Verify all products are in the correct vendor folder structure
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n📂 VERIFYING IMAGE STRUCTURE\n');

  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, title, slug, vendor_id, image_url');

    let vendorStructure = 0;
    let flatStructure = 0;
    let productImages = 0;
    let other = 0;

    const issues = [];

    for (const product of products) {
      if (product.image_url?.includes('listings-images/vendors/')) {
        vendorStructure++;
      } else if (product.image_url?.includes('listings-images/')) {
        flatStructure++;
        issues.push(`${product.title}: FLAT STRUCTURE`);
      } else if (product.image_url?.includes('product-images/')) {
        productImages++;
        issues.push(`${product.title}: product-images/`);
      } else {
        other++;
        issues.push(`${product.title}: OTHER - ${product.image_url}`);
      }
    }

    console.log(`✅ VENDOR STRUCTURE:  ${vendorStructure}/${products.length} (${((vendorStructure/products.length)*100).toFixed(1)}%)`);
    console.log(`⚠️  FLAT STRUCTURE:    ${flatStructure}/${products.length}`);
    console.log(`📦 PRODUCT-IMAGES:    ${productImages}/${products.length}`);
    console.log(`❌ OTHER:             ${other}/${products.length}`);

    if (issues.length > 0) {
      console.log('\n📋 PRODUCTS NEEDING MIGRATION:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }

    console.log('\n✨ SAMPLE URLS:\n');
    const samples = products.filter(p => p.image_url).slice(0, 3);
    samples.forEach(p => {
      console.log(`"${p.title}"`);
      console.log(`  ${p.image_url}\n`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
