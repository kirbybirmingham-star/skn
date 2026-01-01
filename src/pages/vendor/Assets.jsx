import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getVendorByOwner } from '@/api/EcommerceApi';
import {
  Upload,
  Image as ImageIcon,
  Package,
  FileText,
  Plus,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react';

const VendorAssets = () => {
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock data for demonstration
  const [assets, setAssets] = useState({
    products: [
      {
        id: 1,
        name: 'Sample Product 1',
        type: 'product',
        status: 'active',
        images: ['/placeholder.svg'],
        category: 'electronics',
        price: 29.99,
        inventory: 50
      },
      {
        id: 2,
        name: 'Sample Product 2',
        type: 'product',
        status: 'draft',
        images: ['/placeholder.svg'],
        category: 'clothing',
        price: 49.99,
        inventory: 25
      }
    ],
    media: [
      {
        id: 1,
        name: 'store-banner.jpg',
        type: 'image',
        url: '/placeholder.svg',
        size: '2.3 MB',
        uploadedAt: '2025-01-15'
      },
      {
        id: 2,
        name: 'product-hero.png',
        type: 'image',
        url: '/placeholder.svg',
        size: '1.8 MB',
        uploadedAt: '2025-01-14'
      }
    ]
  });

  useEffect(() => {
    const loadVendor = async () => {
      if (!user?.id) return;

      try {
        const vendorData = await getVendorByOwner(user.id);
        if (vendorData) {
          setVendor(vendorData);
        }
      } catch (error) {
        console.error('Failed to load vendor data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVendor();
  }, [user]);

  const handleFileUpload = (type) => {
    // Placeholder for file upload functionality
    alert(`File upload for ${type} - This feature will be implemented with drag-and-drop upload capability`);
  };

  const filteredProducts = assets.products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'all' || product.category === selectedCategory)
  );

  const filteredMedia = assets.media.filter(media =>
    media.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading assets...</div>;
  }

  if (!vendor) {
    return <div>No store found. Please complete your vendor setup first.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Assets Management</h1>
          <p className="text-gray-600">Manage your products, images, and media files</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleFileUpload('media')}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Media
          </Button>
          <Button onClick={() => handleFileUpload('product')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="media">Media Library</TabsTrigger>
        </TabsList>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Your Products ({filteredProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Start by adding your first product.'}
                  </p>
                  <Button onClick={() => handleFileUpload('product')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Product
                  </Button>
                </div>
              ) : (
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{product.name}</h3>
                        <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                          <span>${product.price}</span>
                          <span>{product.inventory} in stock</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {product.status}
                          </span>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Media Library ({filteredMedia.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredMedia.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No media files found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Upload images and media files for your store.'}
                  </p>
                  <Button onClick={() => handleFileUpload('media')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Media
                  </Button>
                </div>
              ) : (
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                  {filteredMedia.map((media) => (
                    <Card key={media.id} className="overflow-hidden">
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm truncate mb-1">{media.name}</h4>
                        <p className="text-xs text-gray-500">{media.size}</p>
                        <p className="text-xs text-gray-400">{media.uploadedAt}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{assets.products.length}</p>
                <p className="text-sm text-gray-600">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{assets.media.length}</p>
                <p className="text-sm text-gray-600">Media Files</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Upload className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">0 MB</p>
                <p className="text-sm text-gray-600">Storage Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{assets.products.filter(p => p.status === 'active').length}</p>
                <p className="text-sm text-gray-600">Active Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorAssets;