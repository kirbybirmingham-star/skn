/**
 * Storage Path Builder - Constructs vendor-organized storage paths
 * 
 * Storage Structure:
 * listings-images/vendors/{vendor_id}/products/{product_slug}/{image_type}
 */

/**
 * Build path for product main image
 * @param {string} vendorId - The vendor's UUID
 * @param {string} productSlug - The product slug
 * @returns {string} Storage path for main image
 */
export function getProductMainImagePath(vendorId, productSlug) {
  return `vendors/${vendorId}/products/${productSlug}/main.jpg`;
}

/**
 * Build path for product thumbnail
 * @param {string} vendorId - The vendor's UUID
 * @param {string} productSlug - The product slug
 * @returns {string} Storage path for thumbnail
 */
export function getProductThumbnailPath(vendorId, productSlug) {
  return `vendors/${vendorId}/products/${productSlug}/thumbnails/thumb.jpg`;
}

/**
 * Build path for product gallery image
 * @param {string} vendorId - The vendor's UUID
 * @param {string} productSlug - The product slug
 * @param {number} imageIndex - Gallery image number (1-based)
 * @returns {string} Storage path for gallery image
 */
export function getProductGalleryImagePath(vendorId, productSlug, imageIndex) {
  return `vendors/${vendorId}/products/${productSlug}/gallery/${imageIndex}.jpg`;
}

/**
 * Build directory path for a vendor's products
 * @param {string} vendorId - The vendor's UUID
 * @returns {string} Storage directory path
 */
export function getVendorProductsDirectory(vendorId) {
  return `vendors/${vendorId}/products`;
}

/**
 * Build directory path for a specific product
 * @param {string} vendorId - The vendor's UUID
 * @param {string} productSlug - The product slug
 * @returns {string} Storage directory path
 */
export function getProductDirectory(vendorId, productSlug) {
  return `vendors/${vendorId}/products/${productSlug}`;
}

/**
 * Extract vendor ID and product slug from a storage path
 * @param {string} path - Storage path
 * @returns {Object|null} {vendorId, productSlug} or null if path doesn't match pattern
 */
export function parseStoragePath(path) {
  const match = path.match(/vendors\/([^/]+)\/products\/([^/]+)/);
  if (!match) return null;
  return {
    vendorId: match[1],
    productSlug: match[2]
  };
}

/**
 * Generate public URL for a storage path
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Storage path
 * @returns {string} Public URL
 */
export function getPublicUrl(supabaseUrl, bucket, path) {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export default {
  getProductMainImagePath,
  getProductThumbnailPath,
  getProductGalleryImagePath,
  getVendorProductsDirectory,
  getProductDirectory,
  parseStoragePath,
  getPublicUrl
};
