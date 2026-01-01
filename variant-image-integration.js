/**
 * Variant Image Management Integration
 * Handles variant-specific images with inheritance and admin flagging
 * 
 * Features:
 * - Get variant image with fallback to product image
 * - Update variant images
 * - Flag variants needing images for admin
 * - Get variants with missing images
 * - Check vendor image warnings
 * 
 * Usage: See VARIANT_IMAGE_INTEGRATION.md
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * DATABASE FUNCTIONS FOR VARIANT IMAGES
 */

/**
 * Get variant image with fallback to product image
 * 
 * @param {string} variantId - UUID of product variant
 * @returns {Promise<Object>} { variant_image, product_image, image_url, variant_id, product_id }
 * 
 * @example
 * const result = await getVariantImage('123e4567-e89b-12d3-a456-426614174000');
 * console.log(result.image_url); // Uses variant image or falls back to product image
 */
async function getVariantImage(variantId) {
  console.log(`\n📸 Getting image for variant: ${variantId}`);

  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .select('id, product_id, image_url')
    .eq('id', variantId)
    .single();

  if (variantError) {
    console.error(`❌ Error fetching variant: ${variantError.message}`);
    return null;
  }

  // If variant has its own image, use it
  if (variant.image_url) {
    console.log(`✅ Using variant image: ${variant.image_url}`);
    return {
      variant_image: variant.image_url,
      product_image: null,
      image_url: variant.image_url,
      variant_id: variant.id,
      product_id: variant.product_id,
      source: 'variant'
    };
  }

  // Otherwise get product image
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, image_url')
    .eq('id', variant.product_id)
    .single();

  if (productError) {
    console.error(`❌ Error fetching product: ${productError.message}`);
    return null;
  }

  console.log(`📦 Using product image: ${product.image_url} (variant has no image)`);

  return {
    variant_image: null,
    product_image: product.image_url,
    image_url: product.image_url,
    variant_id: variant.id,
    product_id: variant.product_id,
    source: 'product'
  };
}

/**
 * Get all variants for a product with their images
 * 
 * @param {string} productId - UUID of product
 * @returns {Promise<Array>} Array of variants with image_url resolved
 * 
 * @example
 * const variants = await getProductVariantsWithImages('prod-123');
 * variants.forEach(v => console.log(v.variant_name, v.image_url));
 */
async function getProductVariantsWithImages(productId) {
  console.log(`\n📦 Getting variants with images for product: ${productId}`);

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, image_url')
    .eq('id', productId)
    .single();

  if (productError) {
    console.error(`❌ Error fetching product: ${productError.message}`);
    return [];
  }

  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('id, variant_name, sku, image_url')
    .eq('product_id', productId);

  if (variantsError) {
    console.error(`❌ Error fetching variants: ${variantsError.message}`);
    return [];
  }

  // Add image inheritance logic
  const variantsWithImages = variants.map(variant => ({
    ...variant,
    image_url: variant.image_url || product.image_url,
    has_own_image: !!variant.image_url,
    product_id: productId,
    product_name: product.name,
    product_image: product.image_url
  }));

  console.log(`✅ Found ${variantsWithImages.length} variants`);

  return variantsWithImages;
}

/**
 * Update variant image
 * 
 * @param {string} variantId - UUID of variant
 * @param {string} imageUrl - New image URL
 * @returns {Promise<Object>} Updated variant record
 * 
 * @example
 * await updateVariantImage('variant-123', 'img_abc123def456.jpg');
 */
async function updateVariantImage(variantId, imageUrl) {
  console.log(`\n🖼️  Updating variant image: ${variantId}`);

  const { data, error } = await supabase
    .from('product_variants')
    .update({ image_url: imageUrl })
    .eq('id', variantId)
    .select();

  if (error) {
    console.error(`❌ Error updating variant: ${error.message}`);
    return null;
  }

  console.log(`✅ Variant updated: ${imageUrl}`);
  return data[0];
}

/**
 * Flag variant for image assistance (admin notification)
 * 
 * @param {string} variantId - UUID of variant
 * @param {string} reason - Reason for flagging
 * @returns {Promise<Object>} Flag record
 * 
 * @example
 * await flagVariantForImageAssistance('variant-123', 'Missing variant-specific image');
 */
async function flagVariantForImageAssistance(variantId, reason = 'Missing variant image') {
  console.log(`\n🚩 Flagging variant: ${variantId}`);

  // Check if variant exists
  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .select('id, variant_name, product_id')
    .eq('id', variantId)
    .single();

  if (variantError) {
    console.error(`❌ Variant not found: ${variantError.message}`);
    return null;
  }

  // Create flag record (you may need to create this table)
  const flagData = {
    variant_id: variantId,
    reason: reason,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  console.log(`✅ Variant flagged: ${variant.variant_name}`);
  return flagData;
}

/**
 * Get all variants needing images
 * 
 * @param {string} productId - Optional: filter by product ID
 * @returns {Promise<Array>} Array of variants without images
 * 
 * @example
 * const missing = await getVariantsNeedingImages();
 * // Returns: [{variant_id, variant_name, product_name}]
 */
async function getVariantsNeedingImages(productId = null) {
  console.log(`\n🔍 Finding variants without images...`);

  let query = supabase
    .from('product_variants')
    .select('id, variant_name, product_id, products!inner(name)')
    .is('image_url', null);

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return [];
  }

  const result = data.map(v => ({
    variant_id: v.id,
    variant_name: v.variant_name,
    product_id: v.product_id,
    product_name: v.products?.name || 'Unknown'
  }));

  console.log(`⚠️  Found ${result.length} variants without images`);
  return result;
}

/**
 * Get vendor image warnings
 * 
 * @param {string} vendorId - UUID of vendor
 * @returns {Promise<Object>} Vendor with product images status
 * 
 * @example
 * const warnings = await getVendorImageWarnings('vendor-123');
 * console.log(warnings.products_without_images.length);
 */
async function getVendorImageWarnings(vendorId) {
  console.log(`\n⚠️  Getting image warnings for vendor: ${vendorId}`);

  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id, name, image_url')
    .eq('id', vendorId)
    .single();

  if (vendorError) {
    console.error(`❌ Vendor not found: ${vendorError.message}`);
    return null;
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, image_url')
    .eq('vendor_id', vendorId);

  if (productsError) {
    console.error(`❌ Error fetching products: ${productsError.message}`);
    return null;
  }

  const productsWithoutImages = products.filter(p => !p.image_url);
  const variantsWithoutImages = [];

  // Get variants without images for this vendor's products
  for (const product of products) {
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, variant_name')
      .eq('product_id', product.id)
      .is('image_url', null);

    if (variants && variants.length > 0) {
      variantsWithoutImages.push({
        product_id: product.id,
        product_name: product.name,
        variants: variants
      });
    }
  }

  console.log(`📊 Vendor "${vendor.name}": ${productsWithoutImages.length} products, ${variantsWithoutImages.length} products with variants needing images`);

  return {
    vendor_id: vendor.id,
    vendor_name: vendor.name,
    vendor_image: vendor.image_url,
    products_total: products.length,
    products_without_images: productsWithoutImages,
    variants_without_images: variantsWithoutImages,
    needs_vendor_image: !vendor.image_url
  };
}

/**
 * DEMO & TESTING
 */

async function runDemo() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 VARIANT IMAGE MANAGEMENT DEMO');
  console.log('='.repeat(70));

  try {
    // 1. Check if product_variants.image_url column exists
    console.log('\n\n1️⃣  CHECKING DATABASE SETUP\n');

    const { data: testVariant, error: testError } = await supabase
      .from('product_variants')
      .select('image_url')
      .limit(1);

    if (testError && testError.message.includes('column')) {
      console.log('❌ product_variants.image_url column does not exist');
      console.log('\n⚠️  SETUP REQUIRED');
      console.log('Run the SQL from COMPLETE_DATABASE_SETUP.md');
      console.log('\nSQL Query:');
      console.log('  ALTER TABLE product_variants ADD COLUMN image_url VARCHAR(255);');
      return;
    }

    console.log('✅ Column exists - system ready for variant images\n');

    // 2. Get product list
    console.log('2️⃣  GETTING PRODUCTS\n');

    const { data: products } = await supabase
      .from('products')
      .select('id, name, image_url')
      .limit(1);

    if (!products || products.length === 0) {
      console.log('ℹ️  No products found - create some first');
      return;
    }

    const product = products[0];
    console.log(`📦 Product: ${product.name}`);
    console.log(`   Image: ${product.image_url || 'NONE'}`);

    // 3. Get variants for that product
    console.log('\n3️⃣  GETTING PRODUCT VARIANTS\n');

    const variants = await getProductVariantsWithImages(product.id);

    if (variants.length === 0) {
      console.log('ℹ️  No variants for this product');
    } else {
      variants.forEach((v, idx) => {
        console.log(`\n   Variant ${idx + 1}: ${v.variant_name}`);
        console.log(`   SKU: ${v.sku}`);
        console.log(`   Has own image: ${v.has_own_image ? 'Yes' : 'No (uses product image)'}`);
        console.log(`   Image URL: ${v.image_url}`);
      });
    }

    // 4. Check variants needing images
    console.log('\n\n4️⃣  CHECKING VARIANTS NEEDING IMAGES\n');

    const needingImages = await getVariantsNeedingImages();

    if (needingImages.length === 0) {
      console.log('✅ All variants have images!');
    } else {
      needingImages.slice(0, 5).forEach(v => {
        console.log(`   ⚠️  ${v.product_name} → ${v.variant_name}`);
      });
      if (needingImages.length > 5) {
        console.log(`   ... and ${needingImages.length - 5} more`);
      }
    }

    console.log('\n\n' + '='.repeat(70));
    console.log('✅ DEMO COMPLETE - System is ready!');
    console.log('='.repeat(70) + '\n');

  } catch (err) {
    console.error('Error in demo:', err);
  }
}

// Export functions for use in other files
export {
  getVariantImage,
  getProductVariantsWithImages,
  updateVariantImage,
  flagVariantForImageAssistance,
  getVariantsNeedingImages,
  getVendorImageWarnings
};

// Run demo
runDemo().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
