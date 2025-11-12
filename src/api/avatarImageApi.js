import { uploadImage, deleteImage, getImageUrl, getStoragePath } from '@/lib/supabaseStorage';

/**
 * Upload an avatar image and create different sizes
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Object containing URLs for different sizes
 */
export const uploadAvatarImage = async (file, userId) => {
  // Upload original image
  const originalPath = getStoragePath('avatar', userId, 'original', file.name);
  const originalUrl = await uploadImage(file, originalPath, 'avatar');

  // TODO: Add image resizing logic here when needed
  // For now, we'll use the same image for all sizes
  const sizes = ['large', 'medium', 'thumb'];
  const urls = await Promise.all(
    sizes.map(async (size) => {
      const path = getStoragePath('avatar', userId, size, file.name);
      const url = await uploadImage(file, path, 'avatar');
      return { size, url };
    })
  );

  return {
    original: originalUrl,
    ...Object.fromEntries(urls.map(({ size, url }) => [size, url]))
  };
};

/**
 * Delete all sizes of an avatar image
 * @param {string} userId - The user's ID
 */
export const deleteAvatarImage = async (userId) => {
  const sizes = ['original', 'large', 'medium', 'thumb'];
  await Promise.all(
    sizes.map(async (size) => {
      const path = getStoragePath('avatar', userId, size, 'avatar.jpg');
      await deleteImage(path, 'avatar');
    })
  );
};

/**
 * Get the URL for an avatar image
 * @param {string} userId - The user's ID
 * @param {string} size - Size of avatar ('original', 'large', 'medium', 'thumb')
 */
export const getAvatarImageUrl = (userId, size = 'medium') => {
  const path = getStoragePath('avatar', userId, size, 'avatar.jpg');
  return getImageUrl(path, 'avatar');
};