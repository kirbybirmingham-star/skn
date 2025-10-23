import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';

const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZThlYWYxIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvcnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2I4YjJiYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";

const ProductCard = ({ product, index }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const displayVariant = useMemo(() => product.variants[0], [product]);
  const hasSale = useMemo(() => displayVariant && displayVariant.sale_price_in_cents !== null, [displayVariant]);
  const displayPrice = useMemo(() => hasSale ? displayVariant.sale_price_formatted : displayVariant.price_formatted, [displayVariant, hasSale]);
  const originalPrice = useMemo(() => hasSale ? displayVariant.price_formatted : null, [displayVariant, hasSale]);

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.variants.length > 1) {
      navigate(`/product/${product.id}`);
      return;
    }

    const defaultVariant = product.variants[0];

    try {
      await addToCart(product, defaultVariant, 1, defaultVariant.inventory_quantity);
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
            <img
              src={product.image || placeholderImage}
              alt={product.title}
              className="w-full h-48 object-contain"
            />
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
