import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const CartContext = createContext();

const CART_STORAGE_KEY = 'skn-cart';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Format currency helper
const formatCurrency = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  const [user, setUser] = useState(null);

  // Check for authenticated user
  useEffect(() => {
    const checkUser = async () => {
      try {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking user:', error);
      }
    };

    checkUser();

    if (!supabase) return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product, quantity = 1, selectedVariant = null) => {
    return new Promise((resolve, reject) => {
      try {
        setCartItems(prevItems => {
          const cartItemId = selectedVariant 
            ? `${product.id}-${selectedVariant.id}` 
            : product.id;
          
          const existingItem = prevItems.find(item => item.id === cartItemId);

          if (existingItem) {
            return prevItems.map(item =>
              item.id === cartItemId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          }

          const newItem = {
            id: cartItemId,
            product,
            variant: selectedVariant,
            quantity,
            addedAt: new Date().toISOString()
          };

          return [...prevItems, newItem];
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const removeFromCart = useCallback((cartItemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(cartItemId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === cartItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getItemPrice = useCallback((item) => {
    let priceInCents = 0;

    if (item.variant) {
      const variantPrice = item.variant.price_in_cents ?? item.variant.price ?? item.variant.price_cents;
      if (variantPrice != null) {
        const num = Number(variantPrice);
        priceInCents = num > 1000 ? num : num * 100;
      }
    } else {
      const firstVariant = Array.isArray(item.product?.product_variants) && item.product.product_variants.length > 0
        ? item.product.product_variants[0]
        : null;

      const variantPrice = firstVariant && (firstVariant.price_in_cents ?? firstVariant.price ?? firstVariant.price_cents);
      if (variantPrice != null && !Number.isNaN(Number(variantPrice))) {
        const num = Number(variantPrice);
        priceInCents = num > 1000 ? Math.round(num) : Math.round(num * 100);
      } else if (item.product?.base_price != null && !Number.isNaN(Number(item.product.base_price))) {
        const bp = Number(item.product.base_price);
        priceInCents = bp > 1000 ? Math.round(bp) : Math.round(bp * 100);
      }
    }

    return priceInCents / 100;
  }, []);

  const getCartTotalAmount = useCallback(() => {
    return cartItems.reduce((total, item) => {
      return total + (getItemPrice(item) * item.quantity);
    }, 0);
  }, [cartItems, getItemPrice]);

  const getCartTotal = useCallback(() => {
    const total = getCartTotalAmount();
    const currency = cartItems[0]?.product?.currency || 'USD';
    return formatCurrency(total, currency);
  }, [cartItems, getCartTotalAmount]);

  const getItemCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const value = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartTotalAmount,
    getItemPrice,
    getItemCount,
    itemCount: getItemCount(),
    user,
  }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartTotalAmount, getItemPrice, getItemCount, user]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
