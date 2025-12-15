/**
 * Storage Manager - Handle vendor-organized image storage
 * 
 * Features:
 * - Upload images organized by vendor
 * - Generate public URLs
 * - List vendor images
 * - Delete images
 */

import {
  getProductMainImagePath,
  getProductThumbnailPath,
  getProductGalleryImagePath,
  getProductDirectory,
  getPublicUrl
} from './storagePathBuilder.js';

const BUCKET = 'listings-images';

/**
 * Upload product main image
 */
export async function uploadProductMainImage(supabase, vendorId, productSlug, imageBuffer, contentType = 'image/jpeg') {
  const path = getProductMainImagePath(vendorId, productSlug);
  
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, imageBuffer, {
      contentType,
      upsert: true,
      cacheControl: '3600'
    });

  if (error) throw error;
  return { path: data.path, publicUrl: getPublicUrl(supabase._url, BUCKET, path) };
}

/**
 * Upload product thumbnail image
 */
export async function uploadProductThumbnail(supabase, vendorId, productSlug, imageBuffer, contentType = 'image/jpeg') {
  const path = getProductThumbnailPath(vendorId, productSlug);
  
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, imageBuffer, {
      contentType,
      upsert: true,
      cacheControl: '3600'
    });

  if (error) throw error;
  return { path: data.path, publicUrl: getPublicUrl(supabase._url, BUCKET, path) };
}

/**
 * Upload product gallery image
 */
export async function uploadProductGalleryImage(supabase, vendorId, productSlug, imageIndex, imageBuffer, contentType = 'image/jpeg') {
  const path = getProductGalleryImagePath(vendorId, productSlug, imageIndex);
  
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, imageBuffer, {
      contentType,
      upsert: true,
      cacheControl: '3600'
    });

  if (error) throw error;
  return { path: data.path, publicUrl: getPublicUrl(supabase._url, BUCKET, path) };
}

/**
 * Delete product image
 */
export async function deleteProductImage(supabase, path) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (error) throw error;
  return true;
}

/**
 * Delete all images for a product
 */
export async function deleteProductImages(supabase, vendorId, productSlug) {
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET)
    .list(getProductDirectory(vendorId, productSlug), { recursive: true });

  if (listError) throw listError;

  const paths = files.map(f => `${getProductDirectory(vendorId, productSlug)}/${f.name}`);
  if (paths.length === 0) return true;

  const { error: deleteError } = await supabase.storage
    .from(BUCKET)
    .remove(paths);

  if (deleteError) throw deleteError;
  return true;
}

/**
 * List all images for a vendor's products
 */
export async function listVendorProductImages(supabase, vendorId) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(`vendors/${vendorId}/products`, { recursive: true });

  if (error) throw error;
  return data || [];
}

/**
 * List images for a specific product
 */
export async function listProductImages(supabase, vendorId, productSlug) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(getProductDirectory(vendorId, productSlug), { recursive: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get public URL for product main image
 */
export function getProductMainImageUrl(supabase, vendorId, productSlug) {
  const path = getProductMainImagePath(vendorId, productSlug);
  return getPublicUrl(supabase._url, BUCKET, path);
}

/**
 * Get public URL for product thumbnail
 */
export function getProductThumbnailUrl(supabase, vendorId, productSlug) {
  const path = getProductThumbnailPath(vendorId, productSlug);
  return getPublicUrl(supabase._url, BUCKET, path);
}

/**
 * Get public URL for product gallery image
 */
export function getProductGalleryImageUrl(supabase, vendorId, productSlug, imageIndex) {
  const path = getProductGalleryImagePath(vendorId, productSlug, imageIndex);
  return getPublicUrl(supabase._url, BUCKET, path);
}

export default {
  uploadProductMainImage,
  uploadProductThumbnail,
  uploadProductGalleryImage,
  deleteProductImage,
  deleteProductImages,
  listVendorProductImages,
  listProductImages,
  getProductMainImageUrl,
  getProductThumbnailUrl,
  getProductGalleryImageUrl
};
