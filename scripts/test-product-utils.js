#!/usr/bin/env node
/**
 * Product Card Logic - Comprehensive Verification
 * Tests all scenarios to ensure robustness
 */

import {
  normalizeProduct,
  getProductImageUrl,
  formatProductPrice,
  getProductPrice,
  getProductRating,
  validateProductForDisplay,
  getAllProductImages,
  PLACEHOLDER_IMAGE
} from '../src/lib/productUtils.js';

console.log('\n' + '='.repeat(80));
console.log('🧪 PRODUCT CARD LOGIC - VERIFICATION TESTS');
console.log('='.repeat(80) + '\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passCount++;
  } catch (err) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${err.message}`);
    failCount++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Test 1: Normalize Product
console.log('📦 TEST GROUP: normalizeProduct()\n');

test('Should normalize valid product', () => {
  const raw = {
    id: '123',
    title: 'Test Product',
    slug: 'test-product',
    base_price: 2999,
    currency: 'usd',
    image_url: 'https://example.com/image.jpg'
  };
  const normalized = normalizeProduct(raw);
  assert(normalized.title === 'Test Product', 'Title mismatch');
  assert(normalized.base_price === 2999, 'Price mismatch');
  assert(normalized.currency === 'USD', 'Currency not uppercase');
});

test('Should handle null product', () => {
  const result = normalizeProduct(null);
  assert(result === null, 'Should return null');
});

test('Should provide safe defaults', () => {
  const normalized = normalizeProduct({});
  assert(normalized.title === 'Untitled', 'Should have default title');
  assert(normalized.base_price === 0, 'Should default price to 0');
  assert(Array.isArray(normalized.product_variants), 'Variants should be array');
});

test('Should trim whitespace from strings', () => {
  const normalized = normalizeProduct({
    title: '  Product  ',
    slug: '  slug-name  '
  });
  assert(normalized.title === 'Product', 'Title not trimmed');
  assert(normalized.slug === 'slug-name', 'Slug not trimmed');
});

// Test 2: Get Product Image URL
console.log('\n🖼️  TEST GROUP: getProductImageUrl()\n');

test('Should return main image if available', () => {
  const product = normalizeProduct({
    image_url: 'https://example.com/main.jpg',
    gallery_images: ['https://example.com/gallery.jpg']
  });
  const url = getProductImageUrl(product);
  assert(url === 'https://example.com/main.jpg', 'Should use main image');
});

test('Should fallback to gallery images', () => {
  const product = normalizeProduct({
    gallery_images: ['https://example.com/gallery.jpg']
  });
  const url = getProductImageUrl(product);
  assert(url === 'https://example.com/gallery.jpg', 'Should use gallery image');
});

test('Should fallback to variant image', () => {
  const product = normalizeProduct({
    product_variants: [{
      image_url: 'https://example.com/variant.jpg'
    }]
  });
  const url = getProductImageUrl(product);
  assert(url === 'https://example.com/variant.jpg', 'Should use variant image');
});

test('Should return placeholder if no images', () => {
  const product = normalizeProduct({ title: 'No Image Product' });
  const url = getProductImageUrl(product);
  assert(url === PLACEHOLDER_IMAGE, 'Should return placeholder');
});

// Test 3: Format Product Price
console.log('\n💰 TEST GROUP: formatProductPrice()\n');

test('Should format price in cents', () => {
  const formatted = formatProductPrice(2999, 'USD');
  assert(formatted === '$29.99', `Expected $29.99, got ${formatted}`);
});

test('Should handle dollar amounts', () => {
  const formatted = formatProductPrice(29.99, 'USD');
  assert(formatted === '$29.99', `Expected $29.99, got ${formatted}`);
});

test('Should handle null price', () => {
  const formatted = formatProductPrice(null, 'USD');
  assert(formatted === null, 'Should return null for null price');
});

test('Should handle invalid currency gracefully', () => {
  const formatted = formatProductPrice(2999, 'INVALID');
  assert(formatted !== null, 'Should return fallback format');
});

// Test 4: Get Product Price
console.log('\n💵 TEST GROUP: getProductPrice()\n');

test('Should return base price when no variants', () => {
  const product = normalizeProduct({
    base_price: 2999,
    currency: 'USD'
  });
  const priceInfo = getProductPrice(product);
  assert(priceInfo.amount === 2999, 'Amount mismatch');
  assert(priceInfo.source === 'base', 'Should be from base');
});

test('Should prefer variant price', () => {
  const product = normalizeProduct({
    base_price: 2999,
    currency: 'USD',
    product_variants: [{ price_in_cents: 3999 }]
  });
  const priceInfo = getProductPrice(product);
  assert(priceInfo.source === 'variant', 'Should use variant price');
  assert(priceInfo.amount === 3999, 'Variant amount mismatch');
});

test('Should return default for no price', () => {
  const product = normalizeProduct({});
  const priceInfo = getProductPrice(product);
  assert(priceInfo.amount === 0, 'Should default to 0');
  assert(priceInfo.formatted === '$0.00', 'Should format as $0.00');
});

// Test 5: Validate Product
console.log('\n✔️  TEST GROUP: validateProductForDisplay()\n');

test('Should validate complete product', () => {
  const product = normalizeProduct({
    id: '123',
    title: 'Test',
    base_price: 2999,
    image_url: 'https://example.com/image.jpg'
  });
  const validation = validateProductForDisplay(product);
  assert(validation.valid === true, 'Should be valid');
  assert(validation.isDisplayable === true, 'Should be displayable');
});

test('Should reject product without ID', () => {
  const product = normalizeProduct({ title: 'Test' });
  const validation = validateProductForDisplay(product);
  assert(validation.valid === false, 'Should be invalid without ID');
});

test('Should warn about missing title', () => {
  const product = normalizeProduct({ id: '123' });
  const validation = validateProductForDisplay(product);
  assert(validation.warnings.length > 0, 'Should have warnings');
});

// Test 6: Get All Images
console.log('\n📸 TEST GROUP: getAllProductImages()\n');

test('Should collect all available images', () => {
  const product = normalizeProduct({
    image_url: 'https://example.com/main.jpg',
    gallery_images: ['https://example.com/gallery1.jpg', 'https://example.com/gallery2.jpg'],
    product_variants: [{ image_url: 'https://example.com/variant.jpg' }]
  });
  const images = getAllProductImages(product);
  assert(images.length === 4, `Expected 4 images, got ${images.length}`);
});

test('Should remove duplicate images', () => {
  const product = normalizeProduct({
    image_url: 'https://example.com/image.jpg',
    gallery_images: ['https://example.com/image.jpg']
  });
  const images = getAllProductImages(product);
  assert(images.length === 1, 'Should remove duplicates');
});

// Results
console.log('\n' + '='.repeat(80));
console.log('📊 TEST RESULTS');
console.log('='.repeat(80));
console.log(`\n✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📈 Total:  ${passCount + failCount}`);
console.log(`✨ Score:  ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%\n`);

if (failCount === 0) {
  console.log('🎉 ALL TESTS PASSED!\n');
  console.log('Product card logic is robust and ready for production.\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${failCount} tests failed. Review errors above.\n`);
  process.exit(1);
}
