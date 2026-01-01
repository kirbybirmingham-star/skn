import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getVendorByOwner, listProductsByVendor, updateProduct } from '@/api/EcommerceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const VendorInventory = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkUpdates, setBulkUpdates] = useState({});

  useEffect(() => {
    const loadVendor = async () => {
      if (profile?.id) {
        const vendorData = await getVendorByOwner(profile.id);
        setVendor(vendorData);
      }
    };
    loadVendor();
  }, [profile]);

  const loadProducts = async () => {
    if (!vendor) return;
    setLoading(true);
    try {
      const list = await listProductsByVendor(vendor.id);
      setProducts(list);
    } catch (err) {
      toast({ title: 'Failed to load inventory', description: String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [vendor]);

  const handleIndividualStockUpdate = async (productId, variantIndex, newStock) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product || !product.variants || !product.variants[variantIndex]) return;

      const updatedVariants = product.variants.map((v, idx) =>
        idx === variantIndex ? { ...v, inventory_quantity: newStock } : v
      );

      await updateProduct(productId, { ...product, variants: updatedVariants });

      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, variants: updatedVariants } : p
      ));

      toast({ title: 'Stock updated successfully' });
    } catch (err) {
      toast({ title: 'Stock update failed', description: String(err), variant: 'destructive' });
    }
  };

  const handleInventoryChange = (productId, variantIndex, newValue) => {
    setBulkUpdates(prev => ({
      ...prev,
      [`${productId}-${variantIndex}`]: Math.max(0, parseInt(newValue) || 0)
    }));
  };

  const handleBulkUpdate = async () => {
    if (Object.keys(bulkUpdates).length === 0) {
      toast({ title: 'No changes to save', variant: 'destructive' });
      return;
    }

    try {
      const updatePromises = [];

      for (const [key, newInventory] of Object.entries(bulkUpdates)) {
        const [productId, variantIndex] = key.split('-');
        const product = products.find(p => p.id === productId);

        if (product && product.variants && product.variants[variantIndex]) {
          // Validate inventory value
          if (typeof newInventory !== 'number' || newInventory < 0) {
            throw new Error(`Invalid inventory value for variant in product "${product.title}"`);
          }
          
          const updatedVariants = product.variants.map((v, idx) =>
            idx === parseInt(variantIndex) ? { ...v, inventory_quantity: newInventory } : v
          );

          updatePromises.push(
            updateProduct(productId, {
              ...product,
              variants: updatedVariants
            }).then(() => {
              // Optimistic update
              setProducts(prev => prev.map(p =>
                p.id === productId ? { ...p, variants: updatedVariants } : p
              ));
            })
          );
        }
      }

      await Promise.all(updatePromises);
      toast({ title: 'Success', description: 'Inventory updated successfully', variant: 'default' });
      setBulkUpdates({});
      loadProducts(); // Refresh the data

    } catch (err) {
      console.error('Bulk update error:', err);
      toast({ title: 'Update failed', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const getTotalInventoryForProduct = (product) => {
    return product.variants?.reduce((sum, variant) => sum + (variant.inventory_quantity || 0), 0) || 0;
  };

  const getLowStockItems = () => {
    let count = 0;
    products.forEach(product => {
      product.variants?.forEach(variant => {
        if (variant.inventory_quantity < 5) count++;
      });
    });
    return count;
  };

  if (loading) {
    return <div className="p-8">Loading inventory...</div>;
  }

  if (!vendor) {
    return <div className="p-8">Unable to load vendor information.</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage stock levels and track inventory across all products</p>
        </div>
        <div className="flex gap-4">
          <Card className="px-4 py-2">
            <div className="text-sm text-gray-600">Total Products</div>
            <div className="text-xl font-bold">{products.length}</div>
          </Card>
          <Card className="px-4 py-2">
            <div className="text-sm text-gray-600">Total Stock</div>
            <div className="text-xl font-bold">
              {products.reduce((sum, product) => sum + getTotalInventoryForProduct(product), 0)}
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="text-sm text-gray-600">Low Stock Items</div>
            <div className={`text-xl font-bold ${getLowStockItems() > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {getLowStockItems()}
            </div>
          </Card>
        </div>
      </div>

      {Object.keys(bulkUpdates).length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-blue-800">
              {Object.keys(bulkUpdates).length} item(s) ready to update
            </span>
            <Button onClick={handleBulkUpdate} className="bg-blue-600 hover:bg-blue-700">
              Save All Changes
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No products in inventory</h3>
            <p className="text-gray-500 mb-4">Add products to start managing your inventory</p>
          </div>
        ) : (
          products.map(product => (
            <Card key={product.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  {product.image_url && (
                    <img src={product.image_url} alt={product.title}
                         className="w-16 h-16 object-cover rounded-lg border" />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline">Total Stock: {getTotalInventoryForProduct(product)}</Badge>
                      {product.variants?.length > 1 && (
                        <Badge variant="secondary">{product.variants.length} variants</Badge>
                      )}
                      <Badge variant="outline">{product.category || 'Uncategorized'}</Badge>
                      <div className="ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = '/dashboard/vendor/products'}
                        >
                          ✏️ Edit Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {product.variants?.map((variant, variantIndex) => (
                    <div key={`${product.id}-variant-${variantIndex}`}
                         className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">
                            {variant.title || `Variant ${variantIndex + 1}`}
                          </div>
                          <div className="text-sm text-gray-600">
                            ${(variant.price_in_cents / 100).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Current Stock</div>
                          <div className={`font-bold ${variant.inventory_quantity < 5 ? 'text-red-600' : 'text-green-600'}`}>
                            {variant.inventory_quantity || 0}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const current = variant.inventory_quantity ?? 0;
                              handleIndividualStockUpdate(product.id, variantIndex, Math.max(0, current - 1));
                            }}
                            className="px-2"
                          >
                            ➖
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const current = variant.inventory_quantity ?? 0;
                              handleIndividualStockUpdate(product.id, variantIndex, current + 1);
                            }}
                            className="px-2"
                          >
                            ➕
                          </Button>

                          <div className="w-16">
                            <Label className="text-xs text-gray-600">Set Stock</Label>
                            <Input
                              type="number"
                              min="0"
                              value={bulkUpdates[`${product.id}-${variantIndex}`] ?? variant.inventory_quantity ?? 0}
                              onChange={(e) => handleInventoryChange(product.id, variantIndex, e.target.value)}
                              className="text-center text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default VendorInventory;