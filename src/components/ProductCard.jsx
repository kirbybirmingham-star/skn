import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import { getImageUrl as getSupabaseImageUrl } from '@/lib/supabaseStorage';
import StarRating from './reviews/StarRating';

const placeholderImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23eef2ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23728bd6' font-family='Arial,Helvetica,sans-serif' font-size='20'>No Image</text></svg>";

const getImageUrl = (product) => {
  if (!product) return placeholderImage;

  // Prioritize product.image_url
  if (product.image_url) {
    if (product.image_url.startsWith('http')) {
      return product.image_url;
    }
    return getSupabaseImageUrl(product.image_url, 'products'); // Assuming 'products' bucket
  }

  // Fallback to gallery_images if image_url is not available
  if (product.gallery_images && product.gallery_images.length > 0) {
    const imagePath = product.gallery_images[0];
    if (imagePath) {
      if (imagePath.startsWith('http')) {
        return imagePath;
      }
      return getSupabaseImageUrl(imagePath, 'products'); // Assuming 'products' bucket
    }
  }

  // Fallback to product.images if gallery_images is not available
  if (product.images && product.images.length > 0) {
    const imagePath = product.images[0].url;
    if (imagePath) {
      if (imagePath.startsWith('http')) {
        return imagePath;
      }
      return getSupabaseImageUrl(imagePath, 'products'); // Assuming 'products' bucket
    }
  }
  
  return placeholderImage;
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
  const displayPrice = formatPrice(product.base_price, currency);
  const rating = product.product_ratings?.[0];
  const vendorName = product.vendors?.business_name || 'Seller';

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

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
  }, [product, addToCart, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out group"
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative">
          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
            {!imgLoaded && (
              <div className="w-full h-48 bg-gray-100 animate-pulse" />
            )}
            <img
              src={getImageUrl(product)}
              alt={product.title}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? 'block' : 'hidden'}`}
            />
          </div>
          {product.featured && (
            <div className="absolute top-3 left-3 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-md">Featured</div>
          )}
          {product.ribbon_text && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">{product.ribbon_text}</div>
          )}
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-1">{vendorName}</p>
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2 mb-2 h-14">
            {product.title}
          </h3>
          
          <div className="flex items-center mb-2">
            {rating && rating.avg_rating > 0 ? (
              <>
                <StarRating rating={rating.avg_rating} />
                <span className="text-sm text-gray-500 ml-2">({rating.review_count} reviews)</span>
              </>
            ) : (
              <span className="text-sm text-gray-400">No reviews yet</span>
            )}
          </div>

          <div className="flex items-baseline justify-between mb-4">
            {displayPrice ? (
              <span className="text-2xl font-bold text-gray-800">{displayPrice}</span>
            ) : (
              <span className="text-lg font-medium text-gray-400">Price not set</span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4 space-y-2">
        <Button 
          onClick={handleAddToCart} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg py-2 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <ShoppingCart size={18} />
          Add to Cart
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate(`/product/${product.id}`)}
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-semibold rounded-lg py-2 transition-all duration-300"
        >
          View Details
        </Button>
      </div>
    </motion.div>
  );
};

export default ProductCard;