import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';

const placeholderImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23eef2ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23728bd6' font-family='Arial,Helvetica,sans-serif' font-size='20'>No Image</text></svg>";

const getImageUrl = (product) => {
  if (!product) return placeholderImage;
  const imageUrl = product.image_url || (product.gallery_images && product.gallery_images[0]);
  return imageUrl || placeholderImage;
};

const ProductCard = ({ product, index }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Normalize variants - backend may return variants under `variants` or `product_variants`
  const variants = useMemo(() => (product.variants || product.product_variants || []), [product]);
  const displayVariant = useMemo(() => (variants && variants.length ? variants[0] : null), [variants]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const hasSale = useMemo(() => displayVariant && displayVariant.sale_price_in_cents != null, [displayVariant]);
  const displayPrice = useMemo(() => (displayVariant ? (hasSale ? displayVariant.sale_price_formatted : displayVariant.price_formatted) : null), [displayVariant, hasSale]);
  const originalPrice = useMemo(() => (hasSale && displayVariant ? displayVariant.price_formatted : null), [displayVariant, hasSale]);

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!variants || variants.length === 0) {
      toast({ title: 'No variant available', description: 'This product has no purchasable variants.' });
      return;
    }

    if (variants.length > 1) {
      navigate(`/product/${product.id}`);
      return;
    }

    const defaultVariant = variants[0];

    try {
      await addToCart(product, defaultVariant, 1, defaultVariant.inventory_quantity || 0);
      toast({
        title: "Added to Cart! 🛒",
        description: `${product.title} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: error.message,
      });
    }
  }, [product, addToCart, toast, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <div className="bg-white border border-gray-200 p-4 rounded hover:shadow-md transition-shadow">
        <Link to={`/product/${product.id}`} className="block">
          <div className="aspect-w-1 aspect-h-1 mb-4">
          <div className="aspect-w-1 aspect-h-1 mb-4 relative">
            {!imgLoaded && (
              <div className="w-full h-48 bg-gradient-to-r from-slate-100 to-slate-50 animate-pulse rounded-md flex items-center justify-center">
                <div className="text-slate-400">Loading image…</div>
              </div>
            )}
            <img
              src={product.image || placeholderImage}
              alt={product.title}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-48 object-contain ${imgLoaded ? 'block' : 'hidden'}`}
            />
            {product.featured && (
              <div className="absolute top-3 left-3 bg-yellow-300 text-black px-3 py-1 rounded-full text-sm font-bold">Featured</div>
            )}
          </div>
          </div>
          <h3 className="text-base font-medium text-gray-900 hover:text-blue-600 line-clamp-2 mb-1">
            {product.title}
          </h3>
          
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg font-bold text-gray-900">{displayPrice}</span>
            {hasSale && (
              <span className="text-sm text-gray-500 line-through">{originalPrice}</span>
            )}
          </div>

          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400">
              {"★★★★☆"}
            </div>
            <span className="text-sm text-gray-500 ml-1">(24)</span>
          </div>

          {product.ribbon_text && (
            <div className="text-sm text-blue-600 mb-2">
              {product.ribbon_text}
            </div>
          )}

          <div className="text-sm text-gray-500 mb-3">
            Free delivery
          </div>
        </Link>

        <div className="space-y-2">
          <Button 
            onClick={handleAddToCart} 
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded py-2"
          >
            Add to Cart
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(`/product/${product.id}`)}
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded py-2"
          >
            View Details
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
