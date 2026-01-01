/**
 * Check vendor assignment for all products
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXh4anNxaHR4bnVjaG1la2JwdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzAyNDk5MjAwLCJleHAiOjE4NjAyNjU2MDB9.UmzZa_PG5RJhNabP5VjXqg1RNKmMbXf88V8qknAeVfo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkVendorAssignment() {
  console.log('\n' + '='.repeat(80));
  console.log('VENDOR ASSIGNMENT DIAGNOSTIC');
  console.log('='.repeat(80) + '\n');

  try {
    // Get total count
    console.log('📊 Getting total product count...');
    const { data: countData, error: countError, count } = await supabase
      .from('products')
      .select('id', { count: 'exact' });

    if (countError) {
      console.error('❌ Error getting count:', countError.message);
      return;
    }

    console.log(`✅ Total products in database: ${count}\n`);

    // Get all products with vendor info
    console.log('📋 Fetching all products (paginated)...\n');

    let allProducts = [];
    let page = 0;
    const pageSize = 100;

    while (true) {
      const start = page * pageSize;
      const end = start + pageSize - 1;

      const { data, error } = await supabase
        .from('products')
        .select('id, title, vendor_id, created_at')
        .range(start, end)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching products:', error.message);
        return;
      }

      if (!data || data.length === 0) break;

      allProducts = allProducts.concat(data);
      console.log(`  Loaded ${allProducts.length}/${count} products...`);

      if (data.length < pageSize) break;
      page++;
    }

    console.log(`\n✅ Total products loaded: ${allProducts.length}\n`);

    // Analyze vendor assignment
    const withVendor = allProducts.filter(p => p.vendor_id);
    const withoutVendor = allProducts.filter(p => !p.vendor_id);

    console.log('📊 VENDOR ASSIGNMENT SUMMARY:');
    console.log(`  ✓ Products WITH vendor: ${withVendor.length} (${((withVendor.length / allProducts.length) * 100).toFixed(1)}%)`);
    console.log(`  ✗ Products WITHOUT vendor: ${withoutVendor.length} (${((withoutVendor.length / allProducts.length) * 100).toFixed(1)}%)\n`);

    // Group by vendor
    const byVendor = {};
    withVendor.forEach(p => {
      if (!byVendor[p.vendor_id]) byVendor[p.vendor_id] = [];
      byVendor[p.vendor_id].push(p);
    });

    console.log('📦 PRODUCTS PER VENDOR:\n');
    const vendorList = Object.entries(byVendor)
      .sort((a, b) => b[1].length - a[1].length);

    vendorList.forEach(([vendorId, products]) => {
      console.log(`  ${vendorId.substring(0, 8)}... : ${products.length} products`);
    });

    if (withoutVendor.length > 0) {
      console.log(`\n⚠️  UNASSIGNED PRODUCTS: ${withoutVendor.length}`);
      console.log('\nFirst 10 unassigned products:');
      withoutVendor.slice(0, 10).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.id} - "${p.title}"`);
      });
    }

    console.log('\n' + '='.repeat(80));

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkVendorAssignment();
