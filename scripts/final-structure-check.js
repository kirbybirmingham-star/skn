#!/usr/bin/env node
/**
 * Final verification of vendor structure
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n📂 FINAL VENDOR STRUCTURE VERIFICATION\n');

  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, title, slug, vendor_id, image_url');

    let vendorStructure = 0;
    let flatStructure = 0;
    let productImages = 0;
    let issues = [];

    for (const product of products) {
      if (product.image_url?.includes('listings-images/vendors/')) {
        vendorStructure++;
      } else if (product.image_url?.includes('listings-images/') && !product.image_url?.includes('vendors/')) {
        flatStructure++;
        issues.push(product.title);
      } else if (product.image_url?.includes('product-images/')) {
        productImages++;
        issues.push(product.title);
      }
    }

    console.log(`📊 IMAGE STORAGE SUMMARY`);
    console.log(`========================\n`);
    console.log(`✅ Vendor Structure:   ${vendorStructure}/153 products (${(vendorStructure/153*100).toFixed(1)}%)`);
    console.log(`   Path: listings-images/vendors/[id]/products/[slug]/img_[...].jpg`);
    
    if (flatStructure > 0 || productImages > 0) {
      console.log(`\n⚠️  Products Needing Migration: ${flatStructure + productImages}/153`);
      if (issues.length > 0) {
        issues.slice(0, 5).forEach(title => console.log(`   - ${title}`));
        if (issues.length > 5) console.log(`   ... and ${issues.length - 5} more`);
      }
    }

    console.log('\n📂 DIRECTORY STRUCTURE:\n');
    console.log('listings-images/');
    console.log('├── vendors/');
    console.log('│   ├── [vendor_uuid_1]/');
    console.log('│   │   └── products/');
    console.log('│   │       ├── [product_slug_1]/');
    console.log('│   │       │   ├── img_[id]_[timestamp].jpg');
    console.log('│   │       │   └── variants/  (ready for variant images)');
    console.log('│   │       └── [product_slug_2]/');
    console.log('│   │           └── img_[id]_[timestamp].jpg');
    console.log('│   └── [vendor_uuid_2]/');
    console.log('│       └── products/');
    console.log('│           └── [product_slug_n]/');
    console.log('│               └── img_[id]_[timestamp].jpg');
    console.log('└── product-images/  (legacy, can be cleaned up)\n');

    if (vendorStructure === 153) {
      console.log('✨ ALL PRODUCTS PROPERLY ORGANIZED IN VENDOR STRUCTURE ✨\n');
    } else {
      console.log(`⏳ ${153 - vendorStructure} products still need migration\n`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
