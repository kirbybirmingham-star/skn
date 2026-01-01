import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProductImageGallery = ({ images, className = '' }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const visibleImages = images.filter(img => img !== null && img !== undefined);

  if (!visibleImages || visibleImages.length === 0) {
    return (
      <div className={`w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-gray-500">No images available</span>
      </div>
    );
  }

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % visibleImages.length);
  };

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + visibleImages.length) % visibleImages.length);
  };

  const openModal = (index) => {
    setSelectedIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Main Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          <img
            src={visibleImages[selectedIndex]}
            alt={`Product image ${selectedIndex + 1}`}
            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => openModal(selectedIndex)}
            loading="lazy"
          />

          {/* Zoom Icon Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
            <ZoomIn className="w-8 h-8 text-white" />
          </div>

          {/* Navigation Arrows */}
          {visibleImages.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-md"
                onClick={prevImage}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-md"
                onClick={nextImage}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {visibleImages.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {visibleImages.map((image, index) => (
              <button
                key={image}
                onClick={() => setSelectedIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                  index === selectedIndex
                    ? 'border-primary shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal/Lightbox */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white border-0"
              onClick={closeModal}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Modal Image */}
            <img
              src={visibleImages[selectedIndex]}
              alt={`Product image ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Modal Navigation */}
            {visibleImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white border-0"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white border-0"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {selectedIndex + 1} / {visibleImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductImageGallery;