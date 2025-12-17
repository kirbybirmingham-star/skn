import React, { useState } from 'react';
import { X } from 'lucide-react';
import ImageUploader from '@/components/ui/image-uploader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  uploadProductGalleryImage,
  deleteProductImage
} from '@/lib/storageManager';

const ProductImageManager = ({ 
  productId, 
  productSlug,
  vendorId,
  images = [],
  onImagesUpdate 
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    if (!vendorId) {
      toast({
        title: 'Error',
        description: 'Vendor ID is required for image upload',
        variant: 'destructive'
      });
      return;
    }
    
    setUploading(true);
    try {
      const newImageUrls = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageIndex = images.length + i;
        
        // Read file as buffer
        const buffer = await file.arrayBuffer();
        
        // Upload using vendor-organized storage
        const result = await uploadProductGalleryImage(
          supabase,
          vendorId,
          productSlug,
          imageIndex,
          buffer,
          file.type || 'image/jpeg'
        );
        
        newImageUrls.push(result.publicUrl);
      }
      
      // Call the parent component's update handler with new images
      onImagesUpdate([...images, ...newImageUrls]);
      
      toast({
        title: 'Success',
        description: `${newImageUrls.length} image(s) uploaded successfully`
      });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload images',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (imageUrl) => {
    if (!vendorId) {
      toast({
        title: 'Error',
        description: 'Vendor ID is required for image deletion',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Extract path from storage URL
      // URL format: https://supabase-url/storage/v1/object/public/listings-images/vendors/{vendorId}/products/{slug}/*
      const pathMatch = imageUrl.match(/\/listings-images\/(.*)/);
      if (!pathMatch) {
        throw new Error('Invalid image URL format');
      }
      
      const path = pathMatch[1];
      await deleteProductImage(supabase, path);
      
      // Update the images list
      const updatedImages = images.filter(img => img !== imageUrl);
      onImagesUpdate(updatedImages);
      
      toast({
        title: 'Success',
        description: 'Image deleted successfully'
      });
    } catch (error) {
      console.error('Image deletion error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete image',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((imageUrl, index) => (
          <div key={imageUrl} className="relative group">
            <img
              src={imageUrl}
              alt={`Product image ${index + 1}`}
              className="w-full h-40 object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleImageDelete(imageUrl)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <ImageUploader
        onUpload={handleImageUpload}
        maxFiles={5}
        maxSize={5 * 1024 * 1024} // 5MB
        className="mt-4"
      />
    </div>
  );
};

export default ProductImageManager;