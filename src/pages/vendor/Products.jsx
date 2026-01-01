import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getVendorByOwner, listProductsByVendor, createProduct, updateProduct, deleteProduct, uploadProductImageToBackend } from '@/api/EcommerceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import ProductForm from '@/components/products/ProductForm';
import { supabase } from '@/lib/customSupabaseClient';

const emptyForm = { title: '', description: '', price_in_cents: 0, inventory_quantity: 0, image: '', category: 'Uncategorized', variants: [] };

const VendorProducts = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [cachedImageFile, setCachedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

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
      toast({ title: 'Failed to load products', description: String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [vendor]);

  const openCreate = () => { 
    setForm(emptyForm); 
    setEditingId(null); 
    setCachedImageFile(null);
    setImagePreview('');
    setOpen(true); 
  };
  const openEdit = (p) => {
    // Map database fields to form fields
    // Database: base_price, image_url, category_id, metadata.category_name
    // Form: price_in_cents, image, category
    
    // Get category name from metadata (if custom)
    let categoryName = 'Uncategorized';
    if (p.metadata?.category_name) {
      categoryName = p.metadata.category_name;
    }
    
    setEditingId(p.id);
    setForm({
      title: p.title || '',
      description: p.description || '',
      price_in_cents: p.base_price || 0,
      inventory_quantity: 0,
      image: p.image_url || '',
      category: categoryName,
      variants: []
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || form.title.length < 3) {
      toast({ title: 'Validation', description: 'Title must be at least 3 characters', variant: 'destructive' });
      return;
    }

    try {
      let productId;
      
      if (editingId) {
        // Update existing product
        await updateProduct(editingId, { title: form.title, description: form.description, image: form.image, category: form.category });
        productId = editingId;
      } else {
        // Create new product
        const p = await createProduct(vendor.id, { ...form });
        productId = p.id;
      }

      // Upload image to backend if a file was cached
      if (cachedImageFile) {
        try {
          const uploadResult = await uploadProductImageToBackend(productId, cachedImageFile);
          toast({ title: 'Image uploaded successfully' });
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          toast({ title: 'Product saved but image upload failed', description: String(uploadErr), variant: 'destructive' });
        }
      }
      
      // Refresh product list from database
      const updatedProducts = await listProductsByVendor(vendor.id);
      setProducts(updatedProducts);
      
      toast({ title: editingId ? 'Product updated' : 'Product created' });
      setOpen(false);
      setCachedImageFile(null);
      setImagePreview('');
    } catch (err) {
      toast({ title: 'Save failed', description: String(err), variant: 'destructive' });
    }
  };


  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Product deleted' });
    } catch (err) {
      toast({ title: 'Delete failed', description: String(err), variant: 'destructive' });
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground mt-1">Create, edit, and manage your store's products</p>
        </div>
        <Button onClick={openCreate} size="lg" className="bg-blue-600 hover:bg-blue-700">
          ➕ Add New Product
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading && (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-4">Start building your store by adding your first product</p>
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
              ➕ Add Your First Product
            </Button>
          </div>
        )}
        {products.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  {p.image_url && (
                    <img src={p.image_url} alt={p.title} className="w-20 h-20 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-foreground">{p.title}</h3>
                    <p className="text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                    <div className="flex items-center gap-6 mt-3">
                      <div className="text-lg font-semibold text-success">
                        ${((p.base_price || 0) / 100).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Category: {p.metadata?.category_name || 'Uncategorized'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button variant="outline" onClick={() => openEdit(p)}>✏️ Edit Details</Button>
                <Button variant="secondary" onClick={() => window.location.href = '/dashboard/vendor/inventory'}>📊 Manage Stock</Button>
                <Button variant="destructive" onClick={() => handleDelete(p.id)}>🗑️ Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-lg">
          <Dialog.Title className="text-xl font-bold mb-4">{editingId ? 'Edit Product' : 'Create Product'}</Dialog.Title>
          <Dialog.Description className="sr-only">
            {editingId ? 'Edit existing product details, pricing, and variants' : 'Create a new product with details, pricing, and variants'}
          </Dialog.Description>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="text-sm font-medium">Title *</Label>
              <Input
                className="w-full"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Product title"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                className="w-full min-h-[100px]"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Product description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Input
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  placeholder="Product category"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Image URL</Label>
                <Input
                  value={form.image}
                  onChange={e => setForm({...form, image: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
                <Input
                  type="file"
                  className="mt-2"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    // Cache the file
                    setCachedImageFile(file);
                    
                    // Create preview
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setImagePreview(event.target.result);
                    };
                    reader.readAsDataURL(file);
                    
                    toast({ title: 'Image cached', description: 'Image will be uploaded when you save the product' });
                  }}
                />
                {(imagePreview || form.image) && (
                  <div className="mt-2">
                    <img src={imagePreview || form.image} alt="Preview" className="w-20 h-20 object-cover rounded border" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {cachedImageFile ? '📦 Cached - will upload on save' : 'Current image'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Price (cents)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.price_in_cents}
                  onChange={e => setForm({...form, price_in_cents: Number(e.target.value)})}
                  placeholder="25000"
                />
                <p className="text-xs text-muted-foreground mt-1">${(form.price_in_cents / 100).toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Inventory</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.inventory_quantity}
                  onChange={e => setForm({...form, inventory_quantity: Number(e.target.value)})}
                  placeholder="10"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSave} className="w-full">
                  {editingId ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold mb-4">Product Variants</h4>
              <div className="space-y-3">
                {(form.variants || []).map((v, idx) => (
                  <div key={v.id || idx} className="grid grid-cols-4 gap-3 items-end p-3 border rounded-lg">
                    <div>
                      <Label className="text-xs font-medium">Variant Name</Label>
                      <Input
                        className="w-full"
                        value={v.title}
                        onChange={e => setForm(f => ({ ...f, variants: f.variants.map((vv,i) => i===idx ? { ...vv, title: e.target.value } : vv) }))}
                        placeholder="e.g., Small, Red, etc."
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Price (cents)</Label>
                      <Input
                        type="number"
                        min="0"
                        className="w-full"
                        value={v.price_in_cents}
                        onChange={e => setForm(f => ({ ...f, variants: f.variants.map((vv,i) => i===idx ? { ...vv, price_in_cents: Number(e.target.value) } : vv) }))}
                        placeholder="25000"
                      />
                      <p className="text-xs text-muted-foreground mt-1">${((v.price_in_cents || 0) / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Stock</Label>
                      <Input
                        type="number"
                        min="0"
                        className="w-full"
                        value={v.inventory_quantity}
                        onChange={e => setForm(f => ({ ...f, variants: f.variants.map((vv,i) => i===idx ? { ...vv, inventory_quantity: Number(e.target.value) } : vv) }))}
                        placeholder="10"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setForm(f => ({ ...f, variants: f.variants.filter((_,i) => i!==idx) }))}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setForm(f => ({ ...f, variants: [...(f.variants||[]), { id: null, title: '', price_in_cents: 0, inventory_quantity: 0 }] }))}
              >
                ➕ Add Variant
              </Button>
            </div>

          </div>
          <button className="absolute top-3 right-3 text-slate-500" onClick={() => setOpen(false)}>Close</button>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
};

export default VendorProducts;
