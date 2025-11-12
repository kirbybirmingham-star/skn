import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ProductImageManager from '@/components/products/ProductImageManager';
import { Card } from '@/components/ui/card';

const ProductForm = ({ 
  product, 
  onSubmit, 
  onCancel,
  onImagesUpdate 
}) => {
  const [form, setForm] = React.useState({
    title: product?.title || '',
    description: product?.description || '',
    price_in_cents: product?.price_in_cents || 0,
    inventory_quantity: product?.inventory_quantity || 0,
    category: product?.category || 'Uncategorized'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        
        <Input
          type="number"
          label="Price (in cents)"
          value={form.price_in_cents}
          onChange={(e) => setForm({ ...form, price_in_cents: parseInt(e.target.value) })}
          required
        />
        
        <Input
          type="number"
          label="Inventory Quantity"
          value={form.inventory_quantity}
          onChange={(e) => setForm({ ...form, inventory_quantity: parseInt(e.target.value) })}
          required
        />
        
        <Input
          label="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        />
      </div>

      {product?.id && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Product Images</h3>
          <ProductImageManager
            productId={product.id}
            productSlug={product.slug}
            images={[product.image_url, ...(product.images || []), ...(product.gallery_images || [])].filter(Boolean)}
            onImagesUpdate={(newImages) => onImagesUpdate(product.id, product.slug, newImages)}
          />
        </Card>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {product?.id ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;