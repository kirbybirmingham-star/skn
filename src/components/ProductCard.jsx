import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';

import StarRating from './reviews/StarRating';

const placeholderImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23eef2ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23728bd6' font-family='Arial,Helvetica,sans-serif' font-size='20'>No Image</text></svg>";

const getImageUrl = (product) => {
  if (!product) return placeholderImage;
  // Follow ProductDetailsPage logic: prefer first variant image, then other fields
  const variantImage = product?.product_variants?.[0]?.images?.[0];
  const imageUrl = variantImage || product.image_url || (product.images && product.images[0]) || (product.gallery_images && product.gallery_images[0]) || placeholderImage;
  return imageUrl;
};

const formatPrice = (cents, currency = 'USD') => {
  if (cents == null) return null;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
  } catch (e) {
    return `$${(cents / 100).toFixed(2)}`;
  }
};

const ProductCard = ({ product, index }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);

  const currency = product?.currency || 'USD';
  // If __effective_price was computed by ProductsList for filtering/sorting, use it; otherwise compute from variants/base_price
  const displayPrice = (() => {
    // Prefer __effective_price (from ProductsList client-side filtering/sorting) which is in cents
    if (product?.__effective_price != null && !Number.isNaN(Number(product.__effective_price))) {
      const cents = Number(product.__effective_price);
      return formatPrice(cents, product?.currency || currency);
    }

    const firstVariant = Array.isArray(product.product_variants) && product.product_variants.length > 0
      ? product.product_variants[0]
      : null;

    const variantPrice = firstVariant && (firstVariant.price_in_cents ?? firstVariant.price ?? firstVariant.price_cents);
    if (variantPrice != null && !Number.isNaN(Number(variantPrice))) {
      const num = Number(variantPrice);
      // Normalize heuristic: treat integer values as cents, and values with decimals as dollars
      const cents = Number.isInteger(num) ? Math.round(num) : Math.round(num * 100);
      return formatPrice(cents, product.currency || currency);
    }

    if (product.base_price != null && !Number.isNaN(Number(product.base_price))) {
      const bp = Number(product.base_price);
      const cents = Number.isInteger(bp) ? Math.round(bp) : Math.round(bp * 100);
      return formatPrice(cents, product.currency || currency);
    }

    return null;
  })();
  const resolvedImage = getImageUrl(product);

  React.useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.log(`Resolved image for product ${product?.id}:`, resolvedImage);
      if (!resolvedImage || resolvedImage === placeholderImage) {
        // log full product object when resolution falls back to placeholder
        // eslint-disable-next-line no-console
        console.log('Product object causing placeholder:', product);
      }
      console.log(`Product ${product?.id} featured status:`, product?.featured); // Added log
    } catch (e) {}
  }, [product, resolvedImage]);

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const variant = product.product_variants?.[0] || {
        id: product.id,
        title: product.title,
        price_in_cents: product.base_price,
        currency: product.currency
      };
      await addToCart(product, variant, 1);
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
  }, [product, addToCart, toast]);

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
              src={getImageUrl(product)}
              alt={product.title}
              onLoad={() => setImgLoaded(true)}
              onError={(e) => { e.currentTarget.src = placeholderImage; setImgLoaded(true); }}
              className={`w-full h-48 object-cover rounded-md ${imgLoaded ? 'block' : 'hidden'}`}
            />
            {product.featured && (
              <div className="absolute top-3 left-3 bg-yellow-300 text-black px-3 py-1 rounded-full text-sm font-bold">Featured</div>
            )}
          </div>
          </div>
          <h3 className="text-base font-medium text-gray-900 hover:text-blue-600 line-clamp-2 mb-1">
            {product.title || product.name || product.slug || 'Untitled product'}
          </h3>
          
          <div className="flex items-baseline gap-2 mb-1">
            {displayPrice ? (
              <>
                <span className="text-lg font-bold text-gray-900">{displayPrice}</span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-500">Price not available</span>
            )}
          </div>

          <div className="flex items-center mb-2">
            {product.product_ratings && product.product_ratings.length > 0 ? (
              <>
                <StarRating rating={Math.round(product.product_ratings[0].rating)} />
                <span className="text-sm text-gray-500 ml-1">({product.product_ratings.length})</span>
              </>
            ) : (
              <div className="flex text-yellow-400">
                <span className="text-sm text-gray-500">No reviews yet</span>
              </div>
            )}
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
