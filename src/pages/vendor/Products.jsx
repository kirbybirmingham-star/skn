import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { listProductsBySeller, createProduct, updateProduct, deleteProduct, uploadImageFile } from '@/api/EcommerceApi';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const emptyForm = { title: '', description: '', price_in_cents: 0, inventory_quantity: 0, image: '', category: 'Uncategorized', variants: [] };

const VendorProducts = () => {
  const { profile } = useAuth();
  const sellerId = profile?.id || 'seller-1';
  const { toast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listProductsBySeller(sellerId);
      setProducts(list);
    } catch (err) {
      toast({ title: 'Failed to load products', description: String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [sellerId]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setOpen(true); };
  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({ title: p.title, description: p.description, price_in_cents: p.variants?.[0]?.price_in_cents || 0, inventory_quantity: p.variants?.[0]?.inventory_quantity || 0, image: p.image || '', category: p.category || 'Uncategorized', variants: p.variants || [] });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || form.title.length < 3) {
      toast({ title: 'Validation', description: 'Title must be at least 3 characters', variant: 'destructive' });
      return;
    }

    try {
      if (editingId) {
        // normalize variants: ensure ids and formatted price
        const variantsToSave = (form.variants && form.variants.length) ? form.variants.map((v, i) => ({ id: v.id || `${editingId}-v${i+1}`, title: v.title || `Variant ${i+1}`, price_in_cents: Number(v.price_in_cents || 0), price_formatted: `$${((Number(v.price_in_cents)||0)/100).toFixed(2)}`, inventory_quantity: Number(v.inventory_quantity || 0) })) : [{ id: `${editingId}-v1`, title: 'Default', price_in_cents: form.price_in_cents, price_formatted: `$${(form.price_in_cents/100).toFixed(2)}`, inventory_quantity: form.inventory_quantity }];
        const updated = await updateProduct(editingId, { title: form.title, description: form.description, image: form.image, category: form.category, variants: variantsToSave });
        setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...updated } : p));
        toast({ title: 'Product updated' });
      } else {
        const variantsToSave = (form.variants && form.variants.length) ? form.variants.map((v, i) => ({ id: v.id || `${Date.now()}-v${i+1}`, title: v.title || `Variant ${i+1}`, price_in_cents: Number(v.price_in_cents || 0), price_formatted: `$${((Number(v.price_in_cents)||0)/100).toFixed(2)}`, inventory_quantity: Number(v.inventory_quantity || 0) })) : [{ id: `${Date.now()}-v1`, title: 'Default', price_in_cents: form.price_in_cents, price_formatted: `$${(form.price_in_cents/100).toFixed(2)}`, inventory_quantity: form.inventory_quantity }];
        const p = await createProduct(sellerId, { ...form, seller_name: profile?.username || profile?.email, variants: variantsToSave });
        setProducts(prev => [p, ...prev]);
        toast({ title: 'Product created' });
      }
      setOpen(false);
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
        <h1 className="text-2xl font-bold">Your Products</h1>
        <Button onClick={openCreate}>Create Product</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading && <p>Loading...</p>}
        {!loading && products.length === 0 && <p className="text-slate-500">No products yet.</p>}
        {products.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-lg shadow flex items-start justify-between">
            <div>
              <h3 className="font-bold text-lg">{p.title}</h3>
              <p className="text-sm text-slate-500">{p.description}</p>
              <p className="text-sm text-slate-600 mt-2">Price: {p.variants?.[0]?.price_formatted || '$0.00'} • Qty: {p.variants?.[0]?.inventory_quantity ?? 0}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openEdit(p)}>Edit</Button>
              <Button variant="destructive" onClick={() => handleDelete(p.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-lg">
          <Dialog.Title className="text-xl font-bold mb-4">{editingId ? 'Edit Product' : 'Create Product'}</Dialog.Title>
          <div className="grid grid-cols-1 gap-3">
            <label className="text-sm">Title</label>
            <input className="w-full p-2 border rounded" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />

            <label className="text-sm">Description</label>
            <textarea className="w-full p-2 border rounded" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Category</label>
                <input className="w-full p-2 border rounded" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
              </div>
              <div>
                <label className="text-sm">Image URL</label>
                <input className="w-full p-2 border rounded" value={form.image} onChange={e => setForm({...form, image: e.target.value})} />
                <input type="file" className="w-full mt-2" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const url = await uploadImageFile(file);
                    setForm(f => ({ ...f, image: url }));
                    toast({ title: 'Image uploaded' });
                  } catch (err) {
                    toast({ title: 'Upload failed', description: String(err), variant: 'destructive' });
                  }
                }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-sm">Price (cents)</label>
                <input type="number" className="w-full p-2 border rounded" value={form.price_in_cents} onChange={e => setForm({...form, price_in_cents: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-sm">Inventory</label>
                <input type="number" className="w-full p-2 border rounded" value={form.inventory_quantity} onChange={e => setForm({...form, inventory_quantity: Number(e.target.value)})} />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSave}>{editingId ? 'Save' : 'Create'}</Button>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold mb-2">Variants</h4>
              {(form.variants || []).map((v, idx) => (
                <div key={v.id || idx} className="grid grid-cols-4 gap-2 items-end mb-2">
                  <div>
                    <label className="text-xs">Title</label>
                    <input className="w-full p-2 border rounded" value={v.title} onChange={e => setForm(f => ({ ...f, variants: f.variants.map((vv,i) => i===idx ? { ...vv, title: e.target.value } : vv) }))} />
                  </div>
                  <div>
                    <label className="text-xs">Price (cents)</label>
                    <input type="number" className="w-full p-2 border rounded" value={v.price_in_cents} onChange={e => setForm(f => ({ ...f, variants: f.variants.map((vv,i) => i===idx ? { ...vv, price_in_cents: Number(e.target.value) } : vv) }))} />
                  </div>
                  <div>
                    <label className="text-xs">Inventory</label>
                    <input type="number" className="w-full p-2 border rounded" value={v.inventory_quantity} onChange={e => setForm(f => ({ ...f, variants: f.variants.map((vv,i) => i===idx ? { ...vv, inventory_quantity: Number(e.target.value) } : vv) }))} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="destructive" onClick={() => setForm(f => ({ ...f, variants: f.variants.filter((_,i) => i!==idx) }))}>Remove</Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={() => setForm(f => ({ ...f, variants: [...(f.variants||[]), { id: null, title: '', price_in_cents: 0, inventory_quantity: 0 }] }))}>Add Variant</Button>
            </div>

          </div>
          <button className="absolute top-3 right-3 text-slate-500" onClick={() => setOpen(false)}>Close</button>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
};

export default VendorProducts;
