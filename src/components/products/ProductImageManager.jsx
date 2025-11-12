import React, { useState } from 'react';
import { X } from 'lucide-react';
import ImageUploader from '@/components/ui/image-uploader';
import { Button } from '@/components/ui/button';
import { uploadImage, deleteImage } from '@/lib/supabaseStorage';
import { useToast } from '@/components/ui/use-toast';

const ProductImageManager = ({ 
  productId, 
  productSlug,
  images = [],
  onImagesUpdate 
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const fileName = `${productSlug}-${Date.now()}-${file.name}`;
        return await uploadImage(file, fileName, 'listings-images');
      });

      const newImageUrls = await Promise.all(uploadPromises);
      
      // Call the parent component's update handler with new images
      onImagesUpdate([...images, ...newImageUrls]);
      
      toast({
        title: 'Success',
        description: 'Images uploaded successfully'
      });
    } catch (error) {
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
    try {
      // Extract the file path from the URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      await deleteImage(fileName, 'listings-images');
      
      // Update the images list
      const updatedImages = images.filter(img => img !== imageUrl);
      onImagesUpdate(updatedImages);
      
      toast({
        title: 'Success',
        description: 'Image deleted successfully'
      });
    } catch (error) {
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