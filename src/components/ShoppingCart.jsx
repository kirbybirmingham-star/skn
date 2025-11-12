import React, { useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingCart as ShoppingCartIcon, X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import PayPalCheckout from './PayPalCheckout';

const ShoppingCart = ({ isCartOpen, setIsCartOpen }) => {
  const { toast } = useToast();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const totalItems = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const handleCheckout = useCallback(async () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Your cart is empty',
        description: 'Add some products to your cart before checking out.',
        variant: 'destructive',
      });
      return;
    }

    // Currently only PayPal checkout is supported
    toast({
      title: 'Checkout Information',
      description: 'Please use the PayPal checkout option above to complete your purchase.',
    });
  }, [cartItems, toast]);

  const handleUpdateQuantity = (variantId, newQuantity, availableQuantity, manageInventory) => {
    updateQuantity(variantId, newQuantity, availableQuantity, manageInventory);
    if (manageInventory && newQuantity >= availableQuantity) {
      toast({
        title: "Stock limit reached",
        description: `You've added the maximum available stock for this item.`,
      });
    }
  };

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
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">Shopping Cart</h2>
              <Button onClick={() => setIsCartOpen(false)} variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-100">
                <X />
              </Button>
            </div>
            <div className="flex-grow p-6 overflow-y-auto space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center text-slate-500 h-full flex flex-col items-center justify-center">
                  <ShoppingCartIcon size={48} className="mb-4 text-slate-400" />
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.variant.id} className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <img src={item.product.image} alt={item.product.title} className="w-20 h-20 object-cover rounded-md" />
                    <div className="flex-grow">
                      <h3 className="font-semibold text-slate-800">{item.product.title}</h3>
                      <p className="text-sm text-slate-600">{item.variant.title}</p>
                      <p className="text-sm text-blue-600 font-bold">
                        {item.variant.sale_price_formatted || item.variant.price_formatted}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center border border-slate-300 rounded-md">
                        <Button onClick={() => handleUpdateQuantity(item.variant.id, item.quantity - 1)} size="sm" variant="ghost" className="px-2 text-slate-600 hover:bg-slate-200">-</Button>
                        <span className="px-2 text-slate-800">{item.quantity}</span>
                        <Button onClick={() => handleUpdateQuantity(item.variant.id, item.quantity + 1, item.variant.inventory_quantity, item.variant.manage_inventory)} size="sm" variant="ghost" className="px-2 text-slate-600 hover:bg-slate-200">+</Button>
                      </div>
                      <Button onClick={() => removeFromCart(item.variant.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-600 text-xs">Remove</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-slate-200">
                <div className="flex justify-between items-center mb-4 text-slate-800">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-2xl font-bold">{getCartTotal()}</span>
                </div>
                <div className="space-y-4">
                  <PayPalCheckout 
                    cartItems={cartItems}
                    onSuccess={() => {
                      clearCart();
                      setIsCartOpen(false);
                    }}
                  />

                  {/* Regular checkout button removed as PayPal is currently the only supported payment method */}
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