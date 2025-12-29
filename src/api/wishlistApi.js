/**
 * Wishlist API
 * Handles wishlist operations (add, remove, get)
 */

import { API_CONFIG } from '@/config/environment';

const API_BASE = `${API_CONFIG.baseURL}/wishlist`;

export const wishlistApi = {
  /**
   * Get user's wishlist
   * @returns {Promise<Array>} - Wishlist items
   */
  getMyWishlist: async () => {
    const response = await fetch(`${API_BASE}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch wishlist');
    }
    
    return response.json();
  },

  /**
   * Add item to wishlist
   * @param {string} variantId - Product variant ID
   * @returns {Promise<Object>} - Added wishlist item
   */
  addToWishlist: async (variantId) => {
    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add to wishlist');
    }
    
    return response.json();
  },

  /**
   * Remove item from wishlist
   * @param {string} variantId - Product variant ID
   * @returns {Promise<void>}
   */
  removeFromWishlist: async (variantId) => {
    const response = await fetch(`${API_BASE}/${variantId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove from wishlist');
    }
  },

  /**
   * Check if item is in wishlist
   * @param {string} variantId - Product variant ID
   * @returns {Promise<boolean>}
   */
  isInWishlist: async (variantId) => {
    const response = await fetch(`${API_BASE}/${variantId}/check`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.inWishlist || false;
  }
};

export default wishlistApi;
