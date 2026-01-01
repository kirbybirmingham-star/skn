#!/usr/bin/env node
/**
 * Check vendor structure in detail
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('📂 VENDOR STRUCTURE DETAIL');
  console.log('='.repeat(80) + '\n');

  try {
    // List vendors
    const { data: vendors } = await supabase
      .storage
      .from('listings-images')
      .list('vendors');

    console.log(`Found ${vendors?.length || 0} vendors\n`);

    // Check first vendor
    if (vendors && vendors.length > 0) {
      const vendor = vendors[0];
      console.log(`📁 Vendor: ${vendor.name}\n`);

      // Check vendor/products
      const { data: productsFolders } = await supabase
        .storage
        .from('listings-images')
        .list(`vendors/${vendor.name}`);

      console.log(`  Subfolders: ${productsFolders?.length || 0}\n`);
      productsFolders?.slice(0, 5).forEach(f => {
        console.log(`    📁 ${f.name}/`);
      });

      // Check a products folder
      if (productsFolders?.find(p => p.name === 'products')) {
        const { data: productsInVendor } = await supabase
          .storage
          .from('listings-images')
          .list(`vendors/${vendor.name}/products`, { limit: 3 });

        console.log(`\n  📁 vendor/${vendor.name}/products/ has ${productsInVendor?.length || 0} items\n`);
        productsInVendor?.slice(0, 3).forEach(p => {
          console.log(`     📁 ${p.name}/`);
        });

        // Check first product
        if (productsInVendor && productsInVendor.length > 0) {
          const product = productsInVendor[0];
          const { data: productContents } = await supabase
            .storage
            .from('listings-images')
            .list(`vendors/${vendor.name}/products/${product.name}`);

          console.log(`\n     Contents of vendor/.../products/${product.name}:\n`);
          productContents?.forEach(f => {
            if (f.id) {
              console.log(`        📄 ${f.name}`);
            } else {
              console.log(`        📁 ${f.name}/`);
            }
          });
        }
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

main();
