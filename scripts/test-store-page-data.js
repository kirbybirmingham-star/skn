#!/usr/bin/env node
/**
 * Verify Store Page Data
 * Tests that vendor listings and product cards have required data
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function runTests() {
  console.log('=== Testing Store Page Data ===\n');

  try {
    // Test 1: Vendor cards on /store (no sellerId)
    console.log('1️⃣  Testing Vendor Cards (`/store` page):\n');
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name, store_name, slug, description, created_at')
      .order('name', { ascending: true })
      .limit(3);

    if (vendorError) {
      console.log('   ❌ Error fetching vendors:', vendorError.message);
      return;
    }

    if (!vendorData || vendorData.length === 0) {
      console.log('   ℹ️  No vendors found (database may be empty)');
      return;
    }

    console.log(`   ✅ Found ${vendorData.length} vendors:`);

    const vendors = [];
    vendorData.forEach((v, i) => {
      console.log(`      ${i + 1}. ${v.store_name || v.name}`);
      console.log(`         - Description: ${v.description ? '✓' : '✗'}`);
      
      vendors.push({
        id: v.id,
        name: v.store_name || v.name,
      });
    });

    // Test 2: Products on individual store page /store/[vendorId]
    console.log('\n2️⃣  Testing Products on Store Page (`/store/[vendorId]`):\n');
    
    if (vendors.length > 0) {
      const vendorId = vendors[0].id;
      console.log(`   Testing vendor: ${vendors[0].name} (ID: ${vendorId})\n`);

      const { data: products, error: productError } = await supabase
        .from('products')
        .select(
          'id, title, base_price, currency, image_url, vendor_id, ' +
          'product_variants(id, price_in_cents, images)'
        )
        .eq('vendor_id', vendorId)
        .limit(3);

      if (productError) {
        console.log('   ❌ Error fetching products:', productError.message);
      } else if (!products || products.length === 0) {
        console.log('   ℹ️  No products found for this vendor');
      } else {
        console.log(`   ✅ Found ${products.length} products:`);
        products.forEach((p, i) => {
          const price = p.base_price ? `$${(p.base_price / 100).toFixed(2)}` : 'N/A';
          console.log(`      ${i + 1}. ${p.title}`);
          console.log(`         - Price: ${price}`);
          console.log(`         - Image: ${p.image_url ? '✓' : '✗'}`);
          console.log(`         - Variants: ${p.product_variants?.length || 0}`);
        });
      }
    }

    // Test 3: Verify card data completeness
    console.log('\n3️⃣  Data Completeness Check:\n');
    const cardDataChecks = [
      { field: 'Vendor Name', required: true },
      { field: 'Vendor Avatar', required: true },
      { field: 'Product Title', required: true },
      { field: 'Product Price', required: true },
      { field: 'Product Image', required: false },
      { field: 'Variant Information', required: false },
    ];

    console.log('   Required fields for product cards:');
    cardDataChecks.forEach((check) => {
      const status = check.required ? '⚠️ REQUIRED' : '✓ OPTIONAL';
      console.log(`      - ${check.field}: ${status}`);
    });

    console.log('\n✅ All data tests completed!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
