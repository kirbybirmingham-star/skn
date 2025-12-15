/**
 * Product Image URL Resolver
 * 
 * Resolves product image URLs with fallback to placeholders
 * Supports:
 * - Vendor-organized storage paths
 * - Database image_url field
 * - Placeholder generation for missing images
 */

import { getProductMainImageUrl } from './storageManager.js';
import { getPlaceholderImage } from './placeholderResolver.js';

/**
 * Resolve image URL for a product
 * 
 * Priority:
 * 1. Stored image_url in database
 * 2. Generated path from vendor-organized storage
 * 3. Placeholder image
 */
export function resolveProductImageUrl(product, supabase, options = {}) {
  const {
    fallbackPlaceholder = true,
    placeholderService = 'dicebear',
    size = 400
  } = options;

  // 1. Check if product already has image_url stored
  if (product.image_url && product.image_url.length > 0) {
    return product.image_url;
  }

  // 2. Try to generate URL from vendor-organized storage
  if (product.vendor_id && product.slug && supabase) {
    try {
      const storageUrl = getProductMainImageUrl(
        supabase,
        product.vendor_id,
        product.slug
      );
      return storageUrl;
    } catch (err) {
      console.warn('Error generating storage URL:', err.message);
    }
  }

  // 3. Fall back to placeholder if enabled
  if (fallbackPlaceholder) {
    return getPlaceholderImage(product.slug, product.title, {
      service: placeholderService,
      size
    });
  }

  return null;
}

/**
 * Resolve thumbnail image URL
 */
export function resolveProductThumbnailUrl(product, supabase, options = {}) {
  const { fallbackPlaceholder = true, placeholderService = 'dicebear' } = options;

  if (product.image_thumbnail_url) {
    return product.image_thumbnail_url;
  }

  // For thumbnails, use smaller placeholder
  if (fallbackPlaceholder) {
    return getPlaceholderImage(product.slug, product.title, {
      service: placeholderService,
      size: 200
    });
  }

  return null;
}

/**
 * Resolve gallery images array
 */
export function resolveProductGalleryUrls(product, supabase, options = {}) {
  const { fallbackPlaceholder = true, placeholderService = 'dicebear' } = options;

  // Return stored gallery images if available
  if (product.gallery_images && Array.isArray(product.gallery_images)) {
    const urls = product.gallery_images.filter(url => url && url.length > 0);
    if (urls.length > 0) return urls;
  }

  // Return fallback placeholders
  if (fallbackPlaceholder) {
    return [
      getPlaceholderImage(`${product.slug}-1`, product.title, {
        service: placeholderService,
        size: 400
      }),
      getPlaceholderImage(`${product.slug}-2`, product.title, {
        service: placeholderService,
        size: 400
      })
    ];
  }

  return [];
}

/**
 * Check if product has real image or placeholder
 */
export function hasRealImage(product) {
  return product.image_url && 
         product.image_url.length > 0 &&
         !product.image_url.includes('placeholder') &&
         !product.image_url.includes('dicebear') &&
         !product.image_url.includes('ui-avatars') &&
         !product.image_url.includes('data:image');
}

/**
 * Update product record with resolved image URL
 */
export async function updateProductImageUrl(supabase, productId, imageUrl) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to update product image URL:', err.message);
    throw err;
  }
}

/**
 * Batch resolve image URLs for multiple products
 */
export function resolveBatchProductImages(products, supabase, options = {}) {
  return products.map(product => ({
    ...product,
    image_url: resolveProductImageUrl(product, supabase, options),
    image_thumbnail_url: resolveProductThumbnailUrl(product, supabase, options),
    hasRealImage: hasRealImage(product)
  }));
}

export default {
  resolveProductImageUrl,
  resolveProductThumbnailUrl,
  resolveProductGalleryUrls,
  hasRealImage,
  updateProductImageUrl,
  resolveBatchProductImages
};
