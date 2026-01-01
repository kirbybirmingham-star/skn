/**
 * Image URL Utilities for SKN Bridge Trade
 * Handles resolving image URLs from various sources (Supabase storage, direct URLs, relative paths)
 */

// Get Supabase URL from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const STORAGE_BUCKET = 'product-images';

// Placeholder image for missing product images
export const PLACEHOLDER_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='45%' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='system-ui,sans-serif' font-size='18'>No Image</text><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' fill='%23cbd5e1' font-family='system-ui,sans-serif' font-size='12'>Available</text></svg>";

/**
 * Resolves an image URL from various possible formats
 * @param {string} imageUrl - The image URL (can be relative path, full URL, or storage path)
 * @param {string} bucket - The storage bucket name (default: 'product-images')
 * @returns {string} - The fully resolved public URL
 */
export const resolveImageUrl = (imageUrl, bucket = STORAGE_BUCKET) => {
  if (!imageUrl) return PLACEHOLDER_IMAGE;
  
  // Already a full URL (http/https/data)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // Already has the Supabase storage path structure
  if (imageUrl.includes('/storage/v1/object/public/')) {
    return imageUrl.startsWith('http') ? imageUrl : `${SUPABASE_URL}${imageUrl}`;
  }
  
  // Relative path - construct full Supabase storage URL
  const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanPath}`;
};

/**
 * Gets the best available image URL from a product object
 * Checks multiple possible image fields in priority order
 * @param {Object} product - The product object
 * @returns {string} - The best available image URL or placeholder
 */
export const getProductImageUrl = (product) => {
  if (!product) return PLACEHOLDER_IMAGE;
  
  // Priority order for finding images:
  // 1. First variant's first image
  // 2. product.image_url
  // 3. First item in product.images array
  // 4. First item in product.gallery_images array
  // 5. Placeholder
  
  const variantImage = product?.product_variants?.[0]?.images?.[0];
  const directImage = product?.image_url;
  const firstImage = Array.isArray(product?.images) ? product.images[0] : null;
  const galleryImage = Array.isArray(product?.gallery_images) ? product.gallery_images[0] : null;
  
  const imageUrl = variantImage || directImage || firstImage || galleryImage;
  
  if (!imageUrl) {
    console.log('📷 No image found for product:', product?.title || product?.id);
    return PLACEHOLDER_IMAGE;
  }
  
  return resolveImageUrl(imageUrl);
};

/**
 * Gets all image URLs for a product (for galleries/carousels)
 * @param {Object} product - The product object
 * @returns {string[]} - Array of resolved image URLs
 */
export const getAllProductImages = (product) => {
  if (!product) return [PLACEHOLDER_IMAGE];
  
  const images = [];
  
  // Add variant images
  if (Array.isArray(product?.product_variants)) {
    product.product_variants.forEach(variant => {
      if (Array.isArray(variant?.images)) {
        variant.images.forEach(img => {
          if (img) images.push(resolveImageUrl(img));
        });
      }
    });
  }
  
  // Add direct image_url
  if (product?.image_url) {
    images.push(resolveImageUrl(product.image_url));
  }
  
  // Add images array
  if (Array.isArray(product?.images)) {
    product.images.forEach(img => {
      if (img) images.push(resolveImageUrl(img));
    });
  }
  
  // Add gallery images
  if (Array.isArray(product?.gallery_images)) {
    product.gallery_images.forEach(img => {
      if (img) images.push(resolveImageUrl(img));
    });
  }
  
  // Remove duplicates and return, or return placeholder if empty
  const uniqueImages = [...new Set(images)];
  return uniqueImages.length > 0 ? uniqueImages : [PLACEHOLDER_IMAGE];
};

/**
 * Gets a vendor/store logo URL
 * @param {Object} vendor - The vendor object
 * @returns {string} - The resolved logo URL or placeholder
 */
export const getVendorLogoUrl = (vendor) => {
  if (!vendor) return PLACEHOLDER_IMAGE;
  
  const logoUrl = vendor?.logo_url || vendor?.logo || vendor?.image_url;
  
  if (!logoUrl) return PLACEHOLDER_IMAGE;
  
  return resolveImageUrl(logoUrl, 'vendor-images');
};

/**
 * Gets a user avatar URL
 * @param {Object} user - The user/profile object
 * @returns {string} - The resolved avatar URL or default avatar
 */
export const getUserAvatarUrl = (user) => {
  const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='%23e2e8f0'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='system-ui,sans-serif' font-size='40'>👤</text></svg>";
  
  if (!user) return DEFAULT_AVATAR;
  
  const avatarUrl = user?.avatar_url || user?.avatar || user?.profile_image;
  
  if (!avatarUrl) return DEFAULT_AVATAR;
  
  return resolveImageUrl(avatarUrl, 'avatars');
};

export { SUPABASE_URL, STORAGE_BUCKET };
