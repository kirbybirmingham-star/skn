#!/usr/bin/env node
/**
 * Comprehensive vendor display test
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { formatCurrency } from '../src/api/EcommerceApi.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testVendorDisplay() {
  console.log('🧪 Testing Vendor Card Display System\n');
  console.log('=' .repeat(50) + '\n');

  try {
    // Step 1: Fetch vendors
    console.log('Step 1️⃣  : Fetching vendors from database...');
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, owner_id, name, store_name, description, created_at')
      .order('name', { ascending: true });

    if (vendorError) {
      console.error('❌ Error:', vendorError.message);
      return;
    }

    console.log(`✅ Found ${vendors.length} vendors\n`);

    // Step 2: Fetch products for each vendor
    console.log('Step 2️⃣  : Fetching featured products for each vendor...');
    const vendorsWithProducts = await Promise.all(
      vendors.map(async (v) => {
        const { data: products } = await supabase
          .from('products')
          .select('id, title, base_price, image_url, gallery_images, is_published')
          .eq('vendor_id', v.id)
          .order('created_at', { ascending: false });
        
        return {
          ...v,
          products: products || [],
        };
      })
    );

    const withFeatured = vendorsWithProducts.map(v => {
      const prods = v.products || [];
      const published = prods.filter(p => p.is_published !== false);
      const featured = published.length ? published[0] : (prods[0] || null);
      
      return {
        ...v,
        featured_product: featured ? {
          id: featured.id,
          title: featured.title,
          image: featured.image_url || (featured.gallery_images && featured.gallery_images[0]),
          price: featured.base_price ? formatCurrency(Number(featured.base_price)) : null,
        } : null,
        total_products: prods.length,
      };
    });

    console.log(`✅ Fetched products for all vendors\n`);

    // Step 3: Check vendor card render readiness
    console.log('Step 3️⃣  : Checking vendor card render readiness...\n');
    const renderChecks = withFeatured.map(v => ({
      name: v.store_name || v.name,
      hasId: !!v.id,
      hasName: !!(v.store_name || v.name),
      hasDescription: !!v.description,
      hasFeaturedProduct: !!v.featured_product,
      hasFeaturedImage: !!v.featured_product?.image,
      totalProducts: v.total_products,
    }));

    let allReady = true;
    renderChecks.forEach((check, i) => {
      const ready = check.hasId && check.hasName && check.hasDescription;
      const icon = ready ? '✅' : '⚠️';
      console.log(`${icon} ${i + 1}. ${check.name}`);
      console.log(`   - ID: ${check.hasId ? '✓' : '✗'}`);
      console.log(`   - Name: ${check.hasName ? '✓' : '✗'}`);
      console.log(`   - Description: ${check.hasDescription ? '✓' : '✗'}`);
      console.log(`   - Featured Product: ${check.hasFeaturedProduct ? '✓' : '✗'}`);
      if (check.hasFeaturedProduct) {
        console.log(`     └─ Image: ${check.hasFeaturedImage ? '✓' : '✗'}`);
      }
      console.log(`   - Total Products: ${check.totalProducts}`);
      console.log();
      if (!ready) allReady = false;
    });

    // Step 4: Summary
    console.log('=' .repeat(50));
    console.log('\n📊 Summary:\n');
    const readyCount = renderChecks.filter(c => c.hasId && c.hasName && c.hasDescription).length;
    console.log(`  Vendors Ready to Display: ${readyCount}/${renderChecks.length}`);
    console.log(`  Featured Products: ${renderChecks.filter(c => c.hasFeaturedProduct).length}/${renderChecks.length}`);
    console.log(`  Featured Images: ${renderChecks.filter(c => c.hasFeaturedImage).length}/${renderChecks.length}`);
    
    if (allReady) {
      console.log('\n✅ All vendor cards are ready to display on /store page!');
    } else {
      console.log('\n⚠️  Some vendors missing required fields');
    }

    console.log('\n' + '=' .repeat(50));
    console.log('\n🎯 Next Steps:');
    console.log('  1. Ensure dev server is running: npm run dev');
    console.log('  2. Visit http://localhost:5173/store');
    console.log('  3. Vendor cards should display in a grid');

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testVendorDisplay();
