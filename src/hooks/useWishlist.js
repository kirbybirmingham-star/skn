import { useState, useCallback, useEffect } from 'react';
import wishlistApi from '@/api/wishlistApi';

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const data = await wishlistApi.getMyWishlist();
      setWishlist(data);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWishlist = useCallback(async (variantId) => {
    try {
      const item = await wishlistApi.addToWishlist(variantId);
      setWishlist(prev => [...prev, item]);
      return item;
    } catch (error) {
      throw error;
    }
  }, []);

  const removeFromWishlist = useCallback(async (variantId) => {
    try {
      await wishlistApi.removeFromWishlist(variantId);
      setWishlist(prev => prev.filter(item => item.variant_id !== variantId));
    } catch (error) {
      throw error;
    }
  }, []);

  const isInWishlist = useCallback((variantId) => {
    return wishlist.some(item => item.variant_id === variantId);
  }, [wishlist]);

  return {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    fetchWishlist
  };
};
