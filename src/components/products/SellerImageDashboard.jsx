import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import {
  Upload,
  Image as ImageIcon,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  EyeOff,
  Trash2,
  Download
} from 'lucide-react';
import LazyImage from '@/components/ui/lazy-image';

const SellerImageDashboard = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'name'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'used', 'unused'
  const { toast } = useToast();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);

      // Get all products with their images
      const { data: products, error } = await supabase
        .from('products')
        .select('id, title, slug, image_url, images, gallery_images, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Collect all unique images
      const imageMap = new Map();

      products.forEach(product => {
        const allImages = [
          product.image_url,
          ...(product.images || []),
          ...(product.gallery_images || [])
        ].filter(Boolean);

        allImages.forEach(imageUrl => {
          if (!imageMap.has(imageUrl)) {
            imageMap.set(imageUrl, {
              url: imageUrl,
              products: [],
              uploadDate: product.updated_at,
              fileName: imageUrl.split('/').pop()
            });
          }
          imageMap.get(imageUrl).products.push({
            id: product.id,
            title: product.title,
            slug: product.slug
          });
        });
      });

      const imageList = Array.from(imageMap.values());
      setImages(imageList);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Error',
        description: 'Failed to load images',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images
    .filter(image => {
      const matchesSearch = image.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          image.products.some(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilter = filterBy === 'all' ||
                          (filterBy === 'used' && image.products.length > 0) ||
                          (filterBy === 'unused' && image.products.length === 0);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.uploadDate) - new Date(b.uploadDate);
        case 'name':
          return a.fileName.localeCompare(b.fileName);
        case 'newest':
        default:
          return new Date(b.uploadDate) - new Date(a.uploadDate);
      }
    });

  const toggleImageSelection = (imageUrl) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageUrl)) {
      newSelection.delete(imageUrl);
    } else {
      newSelection.add(imageUrl);
    }
    setSelectedImages(newSelection);
  };

  const selectAll = () => {
    setSelectedImages(new Set(filteredImages.map(img => img.url)));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  const downloadSelectedImages = async () => {
    // Implementation for downloading selected images
    toast({
      title: 'Download Started',
      description: `Downloading ${selectedImages.size} images...`
    });
  };

  const deleteSelectedImages = async () => {
    if (selectedImages.size === 0) return;

    try {
      // Delete from storage and update products
      const deletePromises = Array.from(selectedImages).map(async (imageUrl) => {
        const fileName = imageUrl.split('/').pop();

        // Delete from storage (implement your storage delete logic)
        // await deleteImage(fileName, 'product-images');

        // Update products to remove this image
        const { data: products } = await supabase
          .from('products')
          .select('id, image_url, images, gallery_images');

        for (const product of products) {
          let updated = false;
          if (product.image_url === imageUrl) {
            await supabase
              .from('products')
              .update({ image_url: null })
              .eq('id', product.id);
            updated = true;
          }

          if (product.images?.includes(imageUrl)) {
            const newImages = product.images.filter(img => img !== imageUrl);
            await supabase
              .from('products')
              .update({ images: newImages })
              .eq('id', product.id);
            updated = true;
          }

          if (product.gallery_images?.includes(imageUrl)) {
            const newGallery = product.gallery_images.filter(img => img !== imageUrl);
            await supabase
              .from('products')
              .update({ gallery_images: newGallery })
              .eq('id', product.id);
            updated = true;
          }
        }
      });

      await Promise.all(deletePromises);

      toast({
        title: 'Success',
        description: `Deleted ${selectedImages.size} images`
      });

      clearSelection();
      fetchImages();
    } catch (error) {
      console.error('Error deleting images:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete images',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Image Management</h1>
          <p className="text-gray-600">Manage all product images across your store</p>
        </div>
        <Button className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Images
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{images.length}</p>
              <p className="text-sm text-gray-600">Total Images</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Eye className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{images.filter(img => img.products.length > 0).length}</p>
              <p className="text-sm text-gray-600">In Use</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <EyeOff className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{images.filter(img => img.products.length === 0).length}</p>
              <p className="text-sm text-gray-600">Unused</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Download className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{selectedImages.size}</p>
              <p className="text-sm text-gray-600">Selected</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Images</option>
              <option value="used">In Use</option>
              <option value="unused">Unused</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
            </select>

            <div className="flex border border-gray-300 rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedImages.size > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear Selection
              </Button>
              <Button variant="outline" size="sm" onClick={downloadSelectedImages}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="destructive" size="sm" onClick={deleteSelectedImages}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Images Grid/List */}
      <div className={`grid gap-4 ${
        viewMode === 'grid'
          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
          : 'grid-cols-1'
      }`}>
        {filteredImages.map((image) => (
          <Card
            key={image.url}
            className={`overflow-hidden cursor-pointer transition-all ${
              selectedImages.has(image.url) ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => toggleImageSelection(image.url)}
          >
            <div className={`relative ${viewMode === 'grid' ? 'aspect-square' : 'h-24'}`}>
              <LazyImage
                src={image.url}
                alt={image.fileName}
                className="w-full h-full object-cover"
                placeholder="Loading image..."
              />

              {/* Selection indicator */}
              <div className={`absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center ${
                selectedImages.has(image.url)
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-white bg-black bg-opacity-20'
              }`}>
                {selectedImages.has(image.url) && <div className="w-2 h-2 bg-white rounded-full"></div>}
              </div>

              {/* Status badge */}
              <div className="absolute bottom-2 left-2">
                <Badge variant={image.products.length > 0 ? 'default' : 'secondary'} className="text-xs">
                  {image.products.length > 0 ? 'In Use' : 'Unused'}
                </Badge>
              </div>
            </div>

            {viewMode === 'list' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm truncate">{image.fileName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(image.uploadDate).toLocaleDateString()}
                  </span>
                </div>

                {image.products.length > 0 && (
                  <div className="text-xs text-gray-600">
                    Used in: {image.products.map(p => p.title).join(', ')}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
          <p className="text-gray-600">
            {searchTerm || filterBy !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Upload your first product images to get started'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default SellerImageDashboard;