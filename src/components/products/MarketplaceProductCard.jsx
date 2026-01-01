import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import LazyImage from '@/components/ui/lazy-image';
import StarRating from '../reviews/StarRating';
import {
  normalizeProduct,
  getProductImageUrl,
  getProductPrice,
  getProductRating,
  validateProductForDisplay,
  PLACEHOLDER_IMAGE
} from '@/lib/productUtils';

const MarketplaceProductCard = ({ product: rawProduct, index, viewMode = 'grid' }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);

  // Normalize and validate product data
  const product = normalizeProduct(rawProduct);
  const validation = validateProductForDisplay(product);

  // Log validation issues
  if (index === 0) {
    if (!validation.valid) {
      console.error('🎴 Product validation errors:', validation.errors);
    }
    if (validation.warnings.length > 0) {
      console.warn('🎴 Product validation warnings:', validation.warnings);
    }
    console.log('🎴 MarketplaceProductCard render:', {
      title: product?.title,
      price: product?.base_price,
      currency: product?.currency,
      imageUrl: product?.image_url?.substring(0, 60) || 'PLACEHOLDER',
      index
    });
  }

  if (!product || !validation.isDisplayable) {
    return null;
  }

  // Get price using safe utility
  const priceInfo = getProductPrice(product);
  const displayPrice = priceInfo.formatted;

  // Get rating using safe utility
  const rating = getProductRating(product);
  const resolvedImage = getProductImageUrl(product);

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product, 1);
      toast({ title: 'Added to Cart 🛒', description: `${product.title} added to cart.` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Could not add to cart', description: err.message || String(err) });
    }
  }, [product, addToCart, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-card border border-border rounded-lg hover:shadow-lg transition-all duration-200 group ${
        viewMode === 'list'
          ? 'flex flex-row p-4 gap-6 hover:shadow-xl'
          : 'p-4 hover:shadow-md hover:-translate-y-1'
      }`}
    >
      <Link
        to={`/product/${product.id}`}
        className={`block ${viewMode === 'list' ? 'flex-shrink-0' : ''}`}
      >
        <div className="relative mb-4">
          <LazyImage
            src={resolvedImage}
            alt={product.title || 'Product image'}
            className={`${
              viewMode === 'list' ? 'w-32 h-32' : 'w-full h-48'
            } object-cover rounded-md`}
            placeholder="Loading product image..."
            onLoad={() => {
              setImgLoaded(true);
            }}
            onError={() => {
              console.error('Image failed to load for product:', product?.id);
            }}
          />
          {product.featured && (
            <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
              Featured
            </div>
          )}
        </div>
      </Link>

      <div className={`flex-1 ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}>
        <Link to={`/product/${product.id}`} className="block">
          <h3 className={`font-medium text-foreground hover:text-primary line-clamp-2 mb-2 ${
            viewMode === 'list' ? 'text-lg' : 'text-base'
          }`}>
            {product.title || product.name || product.slug || 'Untitled product'}
          </h3>

          <div className="flex items-baseline gap-2 mb-2">
            {displayPrice ? (
              <span className={`font-bold text-foreground ${
                viewMode === 'list' ? 'text-xl' : 'text-lg'
              }`}>
                {displayPrice}
              </span>
            ) : (
              <span className="text-lg font-bold text-muted-foreground">Price not available</span>
            )}
          </div>

          <div className="flex items-center mb-2">
            {rating ? (
              <>
                <StarRating rating={rating.avg_rating} />
                <span className="text-sm text-muted-foreground ml-1">({rating.review_count})</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">No reviews yet</span>
            )}
          </div>

          {viewMode === 'list' && product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {product.description}
            </p>
          )}

          {product.ribbon_text && (
            <div className="text-sm text-primary mb-2 inline-block bg-primary/10 px-2 py-1 rounded">
              {product.ribbon_text}
            </div>
          )}

          <div className="text-sm text-muted-foreground font-medium">
            🚚 Free delivery
          </div>
        </Link>

        <div className={`space-y-2 mt-4 ${viewMode === 'list' ? 'flex gap-2' : ''}`}>
          <Button
            onClick={handleAddToCart}
            className={`${
              viewMode === 'list'
                ? 'bg-yellow-400 hover:bg-yellow-500 text-black font-semibold'
                : 'w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded py-2'
            }`}
            size={viewMode === 'list' ? 'sm' : 'default'}
          >
            Add to Cart
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/product/${product.id}`)}
            className={viewMode === 'list' ? '' : 'w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded py-2'}
            size={viewMode === 'list' ? 'sm' : 'default'}
          >
            View Details
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketplaceProductCard;
