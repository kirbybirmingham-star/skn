import { uploadImage, deleteImage, getImageUrl } from '@/lib/supabaseStorage';

export const uploadProductImage = async (file, productSlug) => {
  const path = `${productSlug}/${file.name}`;
  return await uploadImage(file, path);
};

export const deleteProductImage = async (imagePath) => {
  await deleteImage(imagePath);
};

export const getProductImageUrl = (imagePath) => {
  return getImageUrl(imagePath);
};