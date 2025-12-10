import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/hooks/useCart';
import { getProductById } from '@/api/EcommerceApi';
import Reviews from '../components/reviews/Reviews';

const ProductDetailsPage = () => {
  const { id: productId } = useParams();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        console.debug('[ProductDetailsPage] useParams id:', productId);
        const p = await getProductById(productId);
        if (!p) {
          console.warn(`[ProductDetailsPage] No product found for id or slug: ${productId}`);
        }
        setProduct(p);
      } catch (error) {
        console.error('[ProductDetailsPage] fetch error:', error);
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

  // Format a price (accepts various price fields used across API)
  const formatPrice = (price, currency = product?.currency || 'USD') => {
    if (price == null) return null;
    try {
      const cents = Number(price) > 1000 ? Math.round(Number(price)) : Math.round(Number(price) * 100);
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
    } catch (e) {
      return `$${(Number(price) / 100).toFixed(2)}`;
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

  if (!product || typeof product !== 'object') {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4 text-yellow-800">
          No product data was returned from the API. This may mean the database is empty, the API is not connected, or the product ID is invalid.<br />
          Please check your database setup and try again.
        </div>
      </div>
    );
  }

  const currentVariant = Array.isArray(product.product_variants) && product.product_variants.length > 0
    ? product.product_variants[selectedVariantIndex] || product.product_variants[0]
    : null;

  // Use MarketplaceProductCard logic for image selection
  const placeholderImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23eef2ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23728bd6' font-family='Arial,Helvetica,sans-serif' font-size='20'>No Image</text></svg>";
  const getImageUrl = (product) => {
    if (!product) return placeholderImage;
    const variantImage = product?.product_variants?.[0]?.images?.[0];
    const imageUrl = variantImage || product.image_url || (product.images && product.images[0]) || (product.gallery_images && product.gallery_images[0]) || placeholderImage;
    return imageUrl;
  };

  const images = [];
  if (currentVariant?.images && Array.isArray(currentVariant.images)) images.push(...currentVariant.images.filter(Boolean));
  if (product.image_url) images.push(product.image_url);
  if (Array.isArray(product.images)) images.push(...product.images.filter(Boolean));
  if (Array.isArray(product.gallery_images)) images.push(...product.gallery_images.filter(Boolean));
  if (images.length === 0) images.push(placeholderImage);

  const imageUrl = images[selectedImage] || getImageUrl(product);


  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {images && images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)} className={`border rounded overflow-hidden ${selectedImage===idx? 'ring-2 ring-blue-500':''}`}>
                  <img src={img} alt={`${product.title || product.name} ${idx+1}`} className="w-20 h-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.title || product.name || product.slug || 'Untitled product'}</h1>
          <p className="text-gray-600 mb-6">{product.description}</p>

          {product.product_variants && product.product_variants.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm mb-2">Variant</label>
              <select value={selectedVariantIndex} onChange={e => { setSelectedVariantIndex(Number(e.target.value)); setSelectedImage(0); }} className="p-2 border rounded w-full">
                {product.product_variants.map((v, idx) => {
                  const priceVal = v.price_in_cents ?? v.price ?? v.price_cents ?? v.base_price ?? null;
                  return (
                    <option key={v.id || idx} value={idx}>{(v.name || v.title) || `Variant ${idx+1}`} — {formatPrice(priceVal)}</option>
                  );
                })}
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

          <div className="text-2xl font-bold mb-6">{(() => {
            // Use MarketplaceProductCard logic for price selection
            const firstVariant = Array.isArray(product?.product_variants) && product.product_variants.length > 0
              ? product.product_variants[0]
              : null;
            const variantPrice = firstVariant && (firstVariant.price_in_cents ?? firstVariant.price ?? firstVariant.price_cents);
            if (variantPrice != null && !Number.isNaN(Number(variantPrice))) {
              const num = Number(variantPrice);
              const cents = num > 1000 ? Math.round(num) : Math.round(num * 100);
              return formatPrice(cents, product?.currency || 'USD');
            }
            if (product?.base_price != null && !Number.isNaN(Number(product.base_price))) {
              const bp = Number(product.base_price);
              const cents = bp > 1000 ? Math.round(bp) : Math.round(bp * 100);
              return formatPrice(cents, product?.currency || 'USD');
            }
            return '$0.00';
          })()}</div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
      <Reviews productId={productId} />
    </div>
  );
};

export default ProductDetailsPage;
