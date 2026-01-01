import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import LazyImage from '@/components/ui/lazy-image';
import { getProductImageUrl, PLACEHOLDER_IMAGE } from '@/lib/imageUtils';
import StarRating from './reviews/StarRating';

const formatPrice = (cents, currency = 'USD') => {
  if (cents == null) return null;
  // If cents is already a dollar amount (not cents), don't divide by 100
  const isCents = cents > 1000; // Assume values > 1000 are cents
  const dollarAmount = isCents ? cents / 100 : cents;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(dollarAmount);
  } catch (e) {
    return `$${dollarAmount.toFixed(2)}`;
  }
};

const ProductCard = ({ product, index }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const currency = product?.currency || 'USD';
  
  // Get the resolved image URL using the utility
  const imageUrl = useMemo(() => getProductImageUrl(product), [product]);
  
  // Prefer variant price (first variant) if present, then product.base_price.
  const displayPrice = useMemo(() => {
    const firstVariant = Array.isArray(product?.product_variants) && product.product_variants.length > 0
      ? product.product_variants[0]
      : null;

    const variantPrice = firstVariant && (firstVariant.price_in_cents ?? firstVariant.price ?? firstVariant.price_cents);
    if (variantPrice != null && !Number.isNaN(Number(variantPrice))) {
      const num = Number(variantPrice);
      const cents = num > 1000 ? Math.round(num) : Math.round(num * 100);
      return formatPrice(cents, product.currency || currency);
    }

    if (product?.base_price != null && !Number.isNaN(Number(product.base_price))) {
      const bp = Number(product.base_price);
      // base_price is already in dollars from vendor_products view
      return formatPrice(bp, product.currency || currency);
    }

    return null;
  }, [product, currency]);
  
  const rating = product?.product_ratings?.[0];
  const stockCount = product?.product_variants?.[0]?.stock_count ?? product?.stock_count;
  const isOutOfStock = stockCount !== undefined && stockCount <= 0;

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
      toast({
        variant: "destructive",
        title: "Out of Stock",
        description: "This item is currently unavailable.",
      });
      return;
    }

    try {
      await addToCart(product, 1);
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
  }, [product, addToCart, toast, isOutOfStock]);

  const handleWishlistToggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from Wishlist" : "Added to Wishlist! ❤️",
      description: isWishlisted 
        ? `${product.title} has been removed from your wishlist.`
        : `${product.title} has been added to your wishlist.`,
    });
  }, [product, isWishlisted, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <div className="bg-card border border-border p-4 rounded-lg hover:shadow-lg transition-all duration-300 relative group">
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm transition-all duration-200"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`} 
          />
        </button>

        <Link to={`/product/${product.id}`} className="block">
          <div className="aspect-w-1 aspect-h-1 mb-4 relative overflow-hidden rounded-md">
            <LazyImage
              src={imageUrl}
              alt={product.title || 'Product image'}
              className="w-full h-48 object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
              placeholder={product.title}
            />
            {product.featured && (
              <div className="absolute top-3 left-3 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                Featured
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  Out of Stock
                </span>
              </div>
            )}
            {stockCount > 0 && stockCount <= 5 && (
              <div className="absolute bottom-3 left-3 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                Only {stockCount} left!
              </div>
            )}
          </div>
          
          <h3 className="text-base font-medium text-foreground hover:text-primary line-clamp-2 mb-1 min-h-[2.5rem]">
            {product.title || product.name || 'Untitled product'}
          </h3>
          
          <div className="flex items-baseline gap-2 mb-1">
            {displayPrice ? (
              <span className="text-lg font-bold text-foreground">{displayPrice}</span>
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

          {product.ribbon_text && (
            <div className="text-sm text-primary mb-2 font-medium">
              {product.ribbon_text}
            </div>
          )}

          <div className="text-sm text-muted-foreground mb-3">
            🚚 Free delivery
          </div>
        </Link>

        <div className="space-y-2">
          <Button 
            onClick={handleAddToCart} 
            disabled={isOutOfStock}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded py-2 transition-colors"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(`/product/${product.id}`)}
            className="w-full border-border text-foreground hover:bg-accent font-semibold rounded py-2"
          >
            View Details
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
