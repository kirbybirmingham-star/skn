import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/hooks/useCart';
import { getProductById } from '@/api/EcommerceApi';

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const p = await getProductById(productId);
        setProduct(p);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load product details', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, toast]);

  const handleAddToCart = () => {
    if (!product) return;
    const variant = product.product_variants?.[selectedVariantIndex] ?? null;
    if (!variant) {
      toast({ title: 'No variant selected', variant: 'destructive' });
      return;
    }

    try {
      addToCart(product, variant, quantity, variant.inventory_quantity);
      toast({ title: 'Success', description: 'Product added to cart' });
    } catch (err) {
      toast({ title: 'Add failed', description: String(err), variant: 'destructive' });
    }
    
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
      </div>
    );
  }

  const currentVariant = product.product_variants?.[selectedVariantIndex] || null;
  const imageUrl = currentVariant?.images?.[0] || product.image_url || 'https://placehold.co/600x600';


  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.title || product.name}</h1>
          <p className="text-gray-600 mb-6">{product.description}</p>

          {product.product_variants && product.product_variants.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm mb-2">Variant</label>
              <select value={selectedVariantIndex} onChange={e => setSelectedVariantIndex(Number(e.target.value))} className="p-2 border rounded w-full">
                {product.product_variants.map((v, idx) => (
                  <option key={v.id || idx} value={idx}>{v.title || `Variant ${idx+1}`} — {v.price_formatted || `$${((v.price_in_cents||0)/100).toFixed(2)}`}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm mb-2">Quantity</label>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border rounded" onClick={() => setQuantity(q => Math.max(1, q-1))}>-</button>
              <input type="number" className="w-20 p-2 border rounded text-center" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
              <button className="px-3 py-1 border rounded" onClick={() => setQuantity(q => q+1)}>+</button>
            </div>
          </div>

          <div className="text-2xl font-bold mb-6">{currentVariant ? (currentVariant.price_formatted || `$${((currentVariant.price_in_cents||0)/100).toFixed(2)}`) : '$0.00'}</div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
