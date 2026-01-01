import React, { useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingCart as ShoppingCartIcon, X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getProductImageUrl } from '@/lib/imageUtils';
import PayPalCheckout from './PayPalCheckout';

const ShoppingCart = ({ isCartOpen, setIsCartOpen }) => {
  const { toast } = useToast();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const totalItems = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const getItemPrice = useCallback((item) => {
    let price = 0;

    if (item.variant) {
      const variantPrice = item.variant.price_in_cents ?? item.variant.price ?? item.variant.price_cents;
      if (variantPrice != null) {
        const num = Number(variantPrice);
        price = num > 1000 ? num : num * 100;
      }
    } else {
      const firstVariant = Array.isArray(item.product?.product_variants) && item.product.product_variants.length > 0
        ? item.product.product_variants[0]
        : null;

      const variantPrice = firstVariant && (firstVariant.price_in_cents ?? firstVariant.price ?? firstVariant.price_cents);
      if (variantPrice != null && !Number.isNaN(Number(variantPrice))) {
        const num = Number(variantPrice);
        price = num > 1000 ? Math.round(num) : Math.round(num * 100);
      } else if (item.product?.base_price != null && !Number.isNaN(Number(item.product.base_price))) {
        const bp = Number(item.product.base_price);
        price = bp > 1000 ? Math.round(bp) : Math.round(bp * 100);
      }
    }

    return (price / 100).toFixed(2);
  }, []);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50"
          onClick={() => setIsCartOpen(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCartIcon className="w-6 h-6" />
                <h2 className="text-xl font-bold">Shopping Cart</h2>
                {totalItems > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {totalItems}
                  </span>
                )}
              </div>
              <Button onClick={() => setIsCartOpen(false)} variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center py-12">
                  <ShoppingCartIcon size={64} className="mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <p className="text-sm mt-1">Add some products to get started!</p>
                  <Button 
                    onClick={() => setIsCartOpen(false)} 
                    className="mt-4"
                    variant="outline"
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                cartItems.map(item => {
                  const imageUrl = getProductImageUrl(item.product);
                  const itemPrice = getItemPrice(item);
                  const itemTotal = (parseFloat(itemPrice) * item.quantity).toFixed(2);

                  return (
                    <motion.div 
                      key={item.id} 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-4 bg-accent/50 p-4 rounded-lg border border-border"
                    >
                      <img 
                        src={imageUrl} 
                        alt={item.product.title} 
                        className="w-20 h-20 object-cover rounded-md flex-shrink-0" 
                      />
                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {item.product.title}
                        </h3>
                        {item.variant && (
                          <p className="text-sm text-muted-foreground">
                            {item.variant.title || 'Default'}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-primary font-bold">${itemPrice}</span>
                          <div className="flex items-center gap-1 border border-border rounded-md">
                            <Button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                              size="icon" 
                              variant="ghost"
                              className="h-8 w-8"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                              size="icon" 
                              variant="ghost"
                              className="h-8 w-8"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground">
                            Subtotal: <span className="font-semibold text-foreground">${itemTotal}</span>
                          </span>
                          <Button 
                            onClick={() => removeFromCart(item.id)} 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer with Total and Checkout */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-border bg-background">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium">Total ({totalItems} items)</span>
                  <span className="text-2xl font-bold text-primary">{getCartTotal()}</span>
                </div>
                
                <div className="space-y-3">
                  <PayPalCheckout 
                    cartItems={cartItems}
                    onSuccess={() => {
                      clearCart();
                      setIsCartOpen(false);
                      toast({
                        title: "Order Placed! 🎉",
                        description: "Thank you for your purchase. You'll receive a confirmation email shortly.",
                      });
                    }}
                  />
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      clearCart();
                      toast({
                        title: "Cart Cleared",
                        description: "All items have been removed from your cart.",
                      });
                    }}
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShoppingCart;
