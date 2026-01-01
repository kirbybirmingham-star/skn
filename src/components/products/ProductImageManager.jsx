import React, { useState } from 'react';
import { X, GripVertical, Eye, EyeOff } from 'lucide-react';
import ImageUploader from '@/components/ui/image-uploader';
import { Button } from '@/components/ui/button';
import { uploadImage, deleteImage } from '@/lib/supabaseStorage';
import { useToast } from '@/components/ui/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Image Component
const SortableImage = ({ imageUrl, index, onDelete, onToggleVisibility, isVisible }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: imageUrl });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group border-2 rounded-lg overflow-hidden ${
        isVisible ? 'border-primary' : 'border-gray-300 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1"
          >
            <GripVertical className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            Image {index + 1}
            {!isVisible && ' (Hidden)'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleVisibility(imageUrl)}
            className="w-6 h-6"
          >
            {isVisible ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(imageUrl)}
            className="w-6 h-6 text-red-600 hover:text-red-700"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <img
        src={imageUrl}
        alt={`Product image ${index + 1}`}
        className="w-full h-32 object-cover"
      />
    </div>
  );
};

const ProductImageManager = ({
  productId,
  productSlug,
  images = [],
  onImagesUpdate
}) => {
  const [uploading, setUploading] = useState(false);
  const [hiddenImages, setHiddenImages] = useState(new Set());
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const fileName = `${productSlug}-${Date.now()}-${file.name}`;
        return await uploadImage(file, fileName, 'product-images');
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

      await deleteImage(fileName, 'product-images');

      // Update the images list
      const updatedImages = images.filter(img => img !== imageUrl);
      onImagesUpdate(updatedImages);

      // Remove from hidden images set if it was hidden
      setHiddenImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageUrl);
        return newSet;
      });

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

  const handleToggleVisibility = (imageUrl) => {
    setHiddenImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageUrl)) {
        newSet.delete(imageUrl);
      } else {
        newSet.add(imageUrl);
      }
      return newSet;
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = images.indexOf(active.id);
      const newIndex = images.indexOf(over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      onImagesUpdate(newImages);
    }
  };

  // Get visible images for display
  const visibleImages = images.filter(img => !hiddenImages.has(img));

  return (
    <div className="space-y-6">
      {/* Image Statistics */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span>Total Images: {images.length}</span>
          <span>Visible: {visibleImages.length}</span>
          <span>Hidden: {hiddenImages.size}</span>
        </div>
      </div>

      {/* Drag and Drop Image Grid */}
      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((imageUrl, index) => (
                <SortableImage
                  key={imageUrl}
                  imageUrl={imageUrl}
                  index={index}
                  onDelete={handleImageDelete}
                  onToggleVisibility={handleToggleVisibility}
                  isVisible={!hiddenImages.has(imageUrl)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center space-y-4">
          <div className="text-sm text-gray-600">
            Upload additional product images (max 10 total, 5MB each)
          </div>
          <ImageUploader
            onUpload={handleImageUpload}
            maxFiles={Math.max(0, 10 - images.length)}
            maxSize={5 * 1024 * 1024} // 5MB
            disabled={images.length >= 10}
            className="w-full"
          />
        </div>
      </div>

      {/* Preview of Visible Images */}
      {visibleImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Preview (as seen by customers):</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {visibleImages.slice(0, 4).map((imageUrl, index) => (
              <img
                key={imageUrl}
                src={imageUrl}
                alt={`Preview ${index + 1}`}
                className="w-16 h-16 object-cover rounded border"
              />
            ))}
            {visibleImages.length > 4 && (
              <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                +{visibleImages.length - 4}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageManager;