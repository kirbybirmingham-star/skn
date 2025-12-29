/**
 * Orders API
 * Handles order creation, retrieval, and status management
 */

import { API_CONFIG } from '@/config/environment';

const API_BASE = `${API_CONFIG.baseURL}/orders`;

export const ordersApi = {
  /**
   * Create a new order
   * @param {Object} orderData - Order details
   * @returns {Promise<Object>} - Created order
   */
  create: async (orderData) => {
    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create order');
    }
    
    return response.json();
  },

  /**
   * Get all orders for the current user
   * @param {Object} options - Query options (page, limit, status, etc.)
   * @returns {Promise<Object>} - Orders list with pagination
   */
  getMyOrders: async (options = {}) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    const url = `${API_BASE}/my-orders${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    return response.json();
  },

  /**
   * Get a specific order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Order details
   */
  getOrder: async (orderId) => {
    const response = await fetch(`${API_BASE}/${orderId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }
    
    return response.json();
  },

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} - Updated order
   */
  updateStatus: async (orderId, status) => {
    const response = await fetch(`${API_BASE}/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
    
    return response.json();
  },

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} - Cancelled order
   */
  cancel: async (orderId, reason) => {
    const response = await fetch(`${API_BASE}/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to cancel order');
    }
    
    return response.json();
  }
};

export default ordersApi;
