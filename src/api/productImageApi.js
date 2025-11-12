import { uploadImage, deleteImage, getImageUrl, getStoragePath } from '@/lib/supabaseStorage';

/**
 * Upload a product image
 * @param {File} file - The image file to upload
 * @param {string} productSlug - The product's slug
 * @param {string} type - Type of image ('main', 'gallery', 'variant')
 * @param {string} variantId - Optional variant ID for variant-specific images
 */
export const uploadProductImage = async (file, productSlug, type = 'gallery', variantId = null) => {
  let path;
  if (variantId) {
    path = getStoragePath('product', productSlug, 'variant', `${variantId}/${file.name}`);
  } else {
    path = getStoragePath('product', productSlug, type, file.name);
  }
  
  // Upload original image
  const imageUrl = await uploadImage(file, path, 'listings-images');
  
  // If this is a main product image, also create and upload a thumbnail
  if (type === 'main') {
    const thumbnailPath = getStoragePath('product', productSlug, 'thumbnail', file.name);
    // TODO: Add image resizing logic here when needed
    await uploadImage(file, thumbnailPath, 'listings-images');
  }
  
  return imageUrl;
};

/**
 * Delete a product image and its associated files
 * @param {string} productSlug - The product's slug
 * @param {string} type - Type of image ('main', 'gallery', 'variant')
 * @param {string} filename - The filename to delete
 */
export const deleteProductImage = async (productSlug, type, filename) => {
  const path = getStoragePath('product', productSlug, type, filename);
  await deleteImage(path, 'listings-images');
  
  // If this was a main image, also delete its thumbnail
  if (type === 'main') {
    const thumbnailPath = getStoragePath('product', productSlug, 'thumbnail', filename);
    await deleteImage(thumbnailPath, 'listings-images');
  }
};

/**
 * Get the URL for a product image
 * @param {string} productSlug - The product's slug
 * @param {string} type - Type of image ('main', 'gallery', 'variant', 'thumbnail')
 * @param {string} filename - The filename
 */
export const getProductImageUrl = (productSlug, type, filename) => {
  const path = getStoragePath('product', productSlug, type, filename);
  return getImageUrl(path, 'listings-images');
};