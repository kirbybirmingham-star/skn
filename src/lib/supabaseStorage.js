import { supabase } from './customSupabaseClient';

/**
 * Uploads a file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} path - The path within the bucket where the file should be stored
 * @param {string} bucketName - The name of the storage bucket (default: 'listings-images')
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
/**
 * Generates a standardized path for storing images
 * @param {string} type - Type of image ('product', 'vendor', 'category', 'avatar')
 * @param {string} id - Identifier (slug or ID)
 * @param {string} subtype - Subtype of image ('main', 'gallery', 'variant', 'thumbnail', etc.)
 * @param {string} filename - Original filename
 * @returns {string} - Standardized storage path
 */
const getStoragePath = (type, id, subtype, filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  
  switch (type) {
    case 'product':
      switch (subtype) {
        case 'main':
          return `products/${id}/main.${extension}`;
        case 'gallery':
          return `products/${id}/gallery/${filename}`;
        case 'variant':
          return `products/${id}/variants/${filename}`;
        case 'thumbnail':
          return `products/${id}/thumbnails/thumb.${extension}`;
        default:
          return `products/${id}/${filename}`;
      }
    case 'vendor':
      return `vendors/${id}/${subtype}.${extension}`;
    case 'category':
      return `categories/${id}/${subtype}.${extension}`;
    case 'avatar':
      return `users/${id}/${subtype}.${extension}`;
    default:
      return filename;
  }
};

export const uploadImage = async (file, path, bucketName = 'listings-images') => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Delete a file from Supabase Storage
 * @param {string} path - The path of the file to delete
 * @param {string} bucketName - The name of the storage bucket (default: 'listings-images')
 */
export const deleteImage = async (path, bucketName = 'listings-images') => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

/**
 * Get the public URL for a file in storage
 * @param {string} path - The path of the file
 * @param {string} bucketName - The name of the storage bucket (default: 'listings-images')
 * @returns {string} - The public URL of the file
 */
export const getImageUrl = (path, bucketName = 'listings-images') => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(path);
  
  return publicUrl;
};