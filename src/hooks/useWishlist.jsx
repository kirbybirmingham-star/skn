import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const WishlistContext = createContext();

const WISHLIST_STORAGE_KEY = 'skn-wishlist';

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for authenticated user
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Fetch wishlist from database
          const { data, error } = await supabase
            .from('wishlists')
            .select('product_id, products(*)')
            .eq('user_id', user.id);
          
          if (!error && data) {
            setWishlistItems(data.map(item => item.product_id));
          }
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const addToWishlist = useCallback(async (productId) => {
    if (!productId) return;

    // Add locally first
    setWishlistItems(prev => {
      if (prev.includes(productId)) return prev;
      return [...prev, productId];
    });

    // Sync to database if logged in
    if (user) {
      try {
        await supabase
          .from('wishlists')
          .insert({ user_id: user.id, product_id: productId })
          .single();
      } catch (error) {
        console.error('Error adding to wishlist:', error);
      }
    }
  }, [user]);

  const removeFromWishlist = useCallback(async (productId) => {
    if (!productId) return;

    // Remove locally first
    setWishlistItems(prev => prev.filter(id => id !== productId));

    // Sync to database if logged in
    if (user) {
      try {
        await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
      } catch (error) {
        console.error('Error removing from wishlist:', error);
      }
    }
  }, [user]);

  const toggleWishlist = useCallback(async (productId) => {
    if (wishlistItems.includes(productId)) {
      await removeFromWishlist(productId);
      return false;
    } else {
      await addToWishlist(productId);
      return true;
    }
  }, [wishlistItems, addToWishlist, removeFromWishlist]);

  const isInWishlist = useCallback((productId) => {
    return wishlistItems.includes(productId);
  }, [wishlistItems]);

  const clearWishlist = useCallback(async () => {
    setWishlistItems([]);
    
    if (user) {
      try {
        await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error clearing wishlist:', error);
      }
    }
  }, [user]);

  const value = useMemo(() => ({
    wishlistItems,
    wishlistCount: wishlistItems.length,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    loading,
  }), [wishlistItems, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, clearWishlist, loading]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistProvider;
