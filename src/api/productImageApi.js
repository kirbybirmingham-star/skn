/**
 * Product Image Management
 * Handles product and variant image logic
 * - Product images stored with UUID-based filenames
 * - Variants inherit product image
 * - Variants flagged for admin assistance if image missing
 */

import { supabase } from '../lib/customSupabaseClient';
import { getPlaceholder } from './imageApi';

/**
 * Get effective image for variant
 * Returns variant image if exists, else product image, else placeholder
 */
export async function getVariantImage(variant, product) {
  // Variant has its own image
  if (variant?.image_url) {
    return variant.image_url;
  }

  // Fall back to product image
  if (product?.image_url) {
    return product.image_url;
  }

  // Use placeholder as last resort
  return await getPlaceholder('product');
}

/**
 * Flag variant for image addition
 * Creates notification for admin when variant lacks image
 */
export async function flagVariantForImageAssistance(variantId, productId, vendorId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: null, // System notification
        vendor_id: vendorId,
        title: 'Variant Image Missing',
        message: `Product variant is using placeholder image. Please add a variant-specific image for better presentation.`,
        type: 'variant_image_needed',
        reference_type: 'variant',
        reference_id: variantId,
        metadata: {
          variant_id: variantId,
          product_id: productId,
          action: 'add_image'
        },
        read: false
      });

    if (error) {
      console.warn('Failed to create image notification:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error flagging variant:', err);
    return false;
  }
}

/**
 * Get all variants for product with their images
 */
export async function getProductVariantsWithImages(productId) {
  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, image_url')
      .eq('id', productId)
      .single();

    if (productError) throw productError;

    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, title, image_url, attributes, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (variantsError) throw variantsError;

    // Enhance variants with effective images
    const enhanced = await Promise.all(
      (variants || []).map(async (variant) => {
        const effectiveImage = await getVariantImage(variant, product);
        const hasOwnImage = !!variant.image_url;
        
        return {
          ...variant,
          image_url: effectiveImage,
          effective_image: effectiveImage,
          has_own_image: hasOwnImage,
          needs_image_flag: !hasOwnImage && product?.image_url, // Inheriting product image
          product_image: product?.image_url || null
        };
      })
    );

    return {
      product: product,
      variants: enhanced
    };
  } catch (error) {
    console.error('Error getting variants with images:', error);
    return {
      product: null,
      variants: []
    };
  }
}

/**
 * Update product image
 * Updates product.image_url
 */
export async function updateProductImage(productId, imageUrl) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      product: data
    };
  } catch (error) {
    console.error('Error updating product image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update variant image
 * Updates product_variants.image_url
 * Clears the "needs image flag" when variant gets its own image
 */
export async function updateVariantImage(variantId, imageUrl) {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .update({
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', variantId)
      .select()
      .single();

    if (error) throw error;

    // Clear any related notifications about missing image
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('reference_id', variantId)
      .eq('type', 'variant_image_needed');

    return {
      success: true,
      variant: data
    };
  } catch (error) {
    console.error('Error updating variant image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get variants needing images (for admin)
 * Returns all variants without images across all vendors
 */
export async function getVariantsNeedingImages(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        id,
        title,
        attributes,
        product_id,
        products (
          id,
          title,
          vendor_id,
          image_url,
          vendors (
            id,
            business_name
          )
        )
      `)
      .is('image_url', null)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter: only include variants where product also lacks image
    // These are variants that truly need their own image
    const filtered = (data || []).filter(variant => {
      const productImage = variant.products?.image_url;
      // Show variants that either:
      // 1. Product has image (variant should customize)
      // 2. Or both product and variant lack images (needs escalation)
      return !variant.image_url;
    });

    return filtered;
  } catch (error) {
    console.error('Error getting variants needing images:', error);
    return [];
  }
}

/**
 * Check if product is complete (has image)
 */
export async function isProductImageComplete(productId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', productId)
      .single();

    if (error) throw error;

    return !!data?.image_url;
  } catch (error) {
    console.error('Error checking product image:', error);
    return false;
  }
}

/**
 * Get image missing warnings for vendor
 * Returns all products/variants lacking images
 */
export async function getVendorImageWarnings(vendorId) {
  try {
    const { data: productsWithoutImages, error: productsError } = await supabase
      .from('products')
      .select('id, title, vendor_id')
      .eq('vendor_id', vendorId)
      .is('image_url', null);

    if (productsError) throw productsError;

    const { data: variantsWithoutImages, error: variantsError } = await supabase
      .from('product_variants')
      .select(`
        id,
        title,
        product_id,
        products (
          id,
          title,
          vendor_id
        )
      `)
      .is('image_url', null)
      .eq('products.vendor_id', vendorId);

    if (variantsError) throw variantsError;

    return {
      productsWithoutImages: productsWithoutImages || [],
      variantsWithoutImages: variantsWithoutImages || [],
      totalWarnings: (productsWithoutImages?.length || 0) + (variantsWithoutImages?.length || 0)
    };
  } catch (error) {
    console.error('Error getting vendor image warnings:', error);
    return {
      productsWithoutImages: [],
      variantsWithoutImages: [],
      totalWarnings: 0
    };
  }
}

/**
 * Bulk update product images
 * Useful for importing products
 */
export async function bulkUpdateProductImages(updates) {
  try {
    const results = [];
    
    for (const update of updates) {
      const { productId, imageUrl, variantId } = update;
      
      if (variantId) {
        // Update variant image
        const result = await updateVariantImage(variantId, imageUrl);
        results.push({
          type: 'variant',
          id: variantId,
          ...result
        });
      } else if (productId) {
        // Update product image
        const result = await updateProductImage(productId, imageUrl);
        results.push({
          type: 'product',
          id: productId,
          ...result
        });
      }
    }

    return {
      success: true,
      results: results,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length
    };
  } catch (error) {
    console.error('Error bulk updating images:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  getVariantImage,
  flagVariantForImageAssistance,
  getProductVariantsWithImages,
  updateProductImage,
  updateVariantImage,
  getVariantsNeedingImages,
  isProductImageComplete,
  getVendorImageWarnings,
  bulkUpdateProductImages
};
 * @param {string} type - Type of image ('main', 'gallery', 'variant', 'thumbnail')
 * @param {string} filename - The filename
 */
export const getProductImageUrl = (productSlug, type, filename) => {
  const path = getStoragePath('product', productSlug, type, filename);
  return getImageUrl(path, 'listings-images');
};