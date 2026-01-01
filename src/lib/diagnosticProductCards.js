/**
 * DIAGNOSTIC: Product Card Display Issue
 * 
 * This file diagnoses why product information is not showing in product cards
 * by checking:
 * 1. Products data is being fetched
 * 2. Products are being normalized correctly
 * 3. Product fields exist and have values
 * 4. Cards are being rendered with data
 */

import { normalizeProduct, validateProductForDisplay, getProductPrice, getProductImageUrl } from '@/lib/productUtils';

export function diagnosticProductCards(products) {
  console.log('\n================================================================================');
  console.log('🔍 DIAGNOSTIC: PRODUCT CARD DISPLAY ISSUE');
  console.log('================================================================================\n');

  if (!products || !Array.isArray(products)) {
    console.error('❌ ERROR: products is not an array:', typeof products, products);
    return;
  }

  console.log(`📦 Total products: ${products.length}\n`);

  if (products.length === 0) {
    console.warn('⚠️  No products in array! Check:');
    console.warn('   1. Is database connected?');
    console.warn('   2. Are there products in the database?');
    console.warn('   3. Is the Supabase client initialized?');
    return;
  }

  // Check first 3 products
  products.slice(0, 3).forEach((rawProduct, idx) => {
    console.log(`\n📋 PRODUCT ${idx + 1}:`);
    console.log('────────────────────────────────────────────────────────────────');

    // Check raw data
    console.log('\n🔹 RAW DATA FROM API:');
    console.log(`   id: ${rawProduct?.id || '❌ MISSING'}`);
    console.log(`   title: ${rawProduct?.title || '❌ MISSING'}`);
    console.log(`   base_price: ${rawProduct?.base_price !== undefined ? rawProduct.base_price : '❌ MISSING'}`);
    console.log(`   currency: ${rawProduct?.currency || '❌ MISSING'}`);
    console.log(`   image_url: ${rawProduct?.image_url ? '✅' : '❌ MISSING'}`);
    console.log(`   description: ${rawProduct?.description ? '✅' : '❌ MISSING'}`);

    // Normalize
    const normalized = normalizeProduct(rawProduct);
    
    if (!normalized) {
      console.error('   ❌ normalizeProduct returned null!');
      return;
    }

    console.log('\n🔹 AFTER NORMALIZATION:');
    console.log(`   id: ${normalized.id || '❌ NULL'}`);
    console.log(`   title: ${normalized.title || '❌ NULL'}`);
    console.log(`   base_price: ${normalized.base_price || '❌ NULL'}`);
    console.log(`   currency: ${normalized.currency || '❌ NULL'}`);
    console.log(`   image_url: ${normalized.image_url || '❌ NULL'}`);

    // Validate
    const validation = validateProductForDisplay(normalized);
    
    console.log('\n🔹 VALIDATION:');
    console.log(`   isDisplayable: ${validation.isDisplayable ? '✅ YES' : '❌ NO'}`);
    
    if (!validation.isDisplayable) {
      console.error('   ❌ ERRORS:', validation.errors);
      console.warn('   ⚠️  WARNINGS:', validation.warnings);
    }

    if (validation.isDisplayable) {
      // Get display values
      const priceInfo = getProductPrice(normalized);
      const imageUrl = getProductImageUrl(normalized);

      console.log('\n🔹 DISPLAY VALUES:');
      console.log(`   price: ${priceInfo.formatted || '❌ NULL'}`);
      console.log(`   image: ${imageUrl && !imageUrl.includes('data:image') ? imageUrl.substring(0, 50) + '...' : imageUrl ? '(using fallback)' : '❌ NULL'}`);
      console.log(`   ✅ SHOULD DISPLAY`);
    } else {
      console.log('\n   ❌ WILL NOT RENDER (validation failed)');
    }
  });

  console.log('\n================================================================================');
  console.log('📊 SUMMARY');
  console.log('================================================================================\n');

  const displayable = products.filter(p => {
    const n = normalizeProduct(p);
    return n && validateProductForDisplay(n).isDisplayable;
  });

  console.log(`✅ Displayable products: ${displayable.length}/${products.length}`);
  
  if (displayable.length === 0) {
    console.error('❌ NO PRODUCTS CAN BE DISPLAYED!');
    console.error('\nPossible causes:');
    console.error('1. Products missing required fields (title, base_price, currency)');
    console.error('2. normalizeProduct is returning null');
    console.error('3. validateProductForDisplay is rejecting all products');
  }

  console.log('\n');
}

export default diagnosticProductCards;
