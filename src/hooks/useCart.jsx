import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { formatCurrency } from '@/api/EcommerceApi';

const CartContext = createContext();

const CART_STORAGE_KEY = 'e-commerce-cart';

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (!storedCart) return [];
      
      const parsed = JSON.parse(storedCart);
      // Migration: filter out old items without variant structure
      const validItems = Array.isArray(parsed) 
        ? parsed.filter(item => item.variant && item.product)
        : [];
      
      return validItems;
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product, variant, quantity = 1) => {
    return new Promise((resolve) => {
      setCartItems(prevItems => {
        // Use variant.id as the unique identifier for cart items
        const variantId = variant?.id;
        if (!variantId) {
          console.error('Cannot add to cart: variant.id is missing', { product, variant });
          return prevItems;
        }
        
        const existingItem = prevItems.find(item => item.variant?.id === variantId);
        let newItems;
        if (existingItem) {
          newItems = prevItems.map(item =>
            item.variant?.id === variantId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newItems = [...prevItems, { product, variant, quantity }];
        }
        
        console.log('Cart updated:', { product: product?.title, variant: variant?.title, quantity, totalItems: newItems.length });
        return newItems;
      });
      resolve();
    });
  }, []);

  const removeFromCart = useCallback((variantId) => {
    setCartItems(prevItems => prevItems.filter(item => item.variant?.id !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId, newQuantity, availableQuantity, manageInventory) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.variant?.id === variantId) {
          let quantityToSet = newQuantity;
          if (quantityToSet < 1) quantityToSet = 1;
          // Respect inventory limits if manage_inventory is enabled
          if (manageInventory && availableQuantity && quantityToSet > availableQuantity) {
            quantityToSet = availableQuantity;
          }
          return { ...item, quantity: quantityToSet };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartTotal = useCallback(() => {
    if (cartItems.length === 0) return formatCurrency(0, { code: 'USD', symbol: '$' });

    const normalizeToCents = (val) => {
      if (val == null) return 0;
      const n = Number(val);
      if (!Number.isFinite(n)) return 0;
      return Number.isInteger(n) ? Math.round(n) : Math.round(n * 100);
    };

    const totalCents = cartItems.reduce((total, item) => {
      // Use variant's sale price if available, otherwise use regular price
      const priceCents = normalizeToCents(
        item.variant?.sale_price_in_cents ?? item.variant?.price_in_cents ?? item.product?.base_price
      );
      return total + (Number(priceCents) * (Number(item.quantity) || 0));
    }, 0);
    return formatCurrency(totalCents, { code: 'USD', symbol: '$' });
  }, [cartItems]);

  const value = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
  }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
