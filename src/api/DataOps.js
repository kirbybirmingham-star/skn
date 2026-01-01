/**
 * Data Operations Layer - Abstraction over API Client
 * 
 * Provides type-safe, validated, and consistent data operations
 * for all CRUD operations throughout the application.
 * 
 * Features:
 * - Automatic validation
 * - Consistent error handling
 * - Request deduplication
 * - Type safety helpers
 * - Optimistic updates
 * - Response normalization
 * 
 * Usage:
 * const product = await dataOps.products.getById('123');
 * await dataOps.products.update('123', { price: 99.99 });
 * await dataOps.vendors.getByOwner(userId);
 */

import apiClient, { ValidationError, ApiError } from './ApiClient.js';

// ============================================================================
// RESPONSE NORMALIZERS
// ============================================================================

/**
 * Ensure response is an object
 */
const normalizeResponse = (response, defaultValue = null) => {
  if (!response) return defaultValue;
  return typeof response === 'object' ? response : { data: response };
};

/**
 * Extract array from response
 */
const normalizeArray = (response, key = 'data') => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response[key])) return response[key];
  return [];
};

/**
 * Extract single item from response
 */
const normalizeSingle = (response, key = 'data') => {
  if (!response) return null;
  if (Array.isArray(response)) return response[0] || null;
  return response[key] || response;
};

// ============================================================================
// PRODUCTS OPERATIONS
// ============================================================================

const products = {
  /**
   * Get all products with filters
   */
  async getAll(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.vendorId) queryParams.append('vendor_id', filters.vendorId);
      if (filters.categoryId) queryParams.append('category_id', filters.categoryId);
      if (filters.searchQuery) queryParams.append('search', filters.searchQuery);
      if (filters.priceRange) queryParams.append('price_range', filters.priceRange);
      if (filters.sortBy) queryParams.append('sort_by', filters.sortBy);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);

      const endpoint = queryParams.toString() ? `/products?${queryParams}` : '/products';
      const response = await apiClient.get(endpoint);
      
      return {
        products: normalizeArray(response, 'products'),
        total: response.total || null,
        page: response.page || 1
      };
    } catch (error) {
      console.error('[Products] Error fetching all:', error);
      throw error;
    }
  },

  /**
   * Get single product by ID
   */
  async getById(productId) {
    if (!productId) throw new ValidationError('Product ID is required');
    
    try {
      const response = await apiClient.get(`/products/${productId}`);
      return normalizeSingle(response);
    } catch (error) {
      console.error(`[Products] Error fetching ${productId}:`, error);
      throw error;
    }
  },

  /**
   * Create new product
   */
  async create(data) {
    const requiredFields = ['title', 'base_price'];
    const constraints = {
      title: { minLength: 3, maxLength: 200 },
      base_price: { min: 0 },
      description: { maxLength: 5000 }
    };

    try {
      const response = await apiClient.postValidated('/products', data, requiredFields, constraints);
      return normalizeSingle(response);
    } catch (error) {
      console.error('[Products] Error creating:', error);
      throw error;
    }
  },

  /**
   * Update product (vendor endpoint)
   */
  async update(productId, data) {
    if (!productId) throw new ValidationError('Product ID is required');
    
    const constraints = {
      title: { minLength: 3, maxLength: 200 },
      base_price: { min: 0 },
      description: { maxLength: 5000 }
    };

    try {
      const response = await apiClient.patchValidated(`/vendor/products/${productId}`, data, constraints);
      return normalizeSingle(response, 'product');
    } catch (error) {
      console.error(`[Products] Error updating ${productId}:`, error);
      throw error;
    }
  },

  /**
   * Delete product
   */
  async delete(productId) {
    if (!productId) throw new ValidationError('Product ID is required');
    
    try {
      const response = await apiClient.delete(`/products/${productId}`);
      return { success: true };
    } catch (error) {
      console.error(`[Products] Error deleting ${productId}:`, error);
      throw error;
    }
  }
};

// ============================================================================
// VENDORS OPERATIONS
// ============================================================================

const vendors = {
  /**
   * Get vendor by owner ID
   */
  async getByOwner(ownerId) {
    if (!ownerId) throw new ValidationError('Owner ID is required');
    
    try {
      const response = await apiClient.get(`/vendors?owner_id=${ownerId}`);
      return normalizeSingle(response);
    } catch (error) {
      console.error(`[Vendors] Error fetching for owner ${ownerId}:`, error);
      throw error;
    }
  },

  /**
   * Get vendor by ID
   */
  async getById(vendorId) {
    if (!vendorId) throw new ValidationError('Vendor ID is required');
    
    try {
      const response = await apiClient.get(`/vendors/${vendorId}`);
      return normalizeSingle(response);
    } catch (error) {
      console.error(`[Vendors] Error fetching ${vendorId}:`, error);
      throw error;
    }
  },

  /**
   * Create vendor
   */
  async create(data) {
    const requiredFields = ['name', 'owner_id'];
    const constraints = {
      name: { minLength: 2, maxLength: 100 },
      description: { maxLength: 1000 }
    };

    try {
      const response = await apiClient.postValidated('/vendors', data, requiredFields, constraints);
      return normalizeSingle(response);
    } catch (error) {
      console.error('[Vendors] Error creating:', error);
      throw error;
    }
  },

  /**
   * Update vendor
   */
  async update(vendorId, data) {
    if (!vendorId) throw new ValidationError('Vendor ID is required');
    
    const constraints = {
      name: { minLength: 2, maxLength: 100 },
      description: { maxLength: 1000 }
    };

    try {
      const response = await apiClient.patchValidated(`/vendors/${vendorId}`, data, constraints);
      return normalizeSingle(response);
    } catch (error) {
      console.error(`[Vendors] Error updating ${vendorId}:`, error);
      throw error;
    }
  },

  /**
   * Get all vendors
   */
  async getAll() {
    try {
      const response = await apiClient.get('/vendors');
      return normalizeArray(response);
    } catch (error) {
      console.error('[Vendors] Error fetching all:', error);
      throw error;
    }
  }
};

// ============================================================================
// ORDERS OPERATIONS
// ============================================================================

const orders = {
  /**
   * Get vendor orders
   */
  async getVendorOrders(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.sortBy) queryParams.append('sort_by', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sort_order', filters.sortOrder);

      const endpoint = queryParams.toString() ? `/vendor/orders?${queryParams}` : '/vendor/orders';
      const response = await apiClient.get(endpoint);
      
      return normalizeArray(response, 'orders');
    } catch (error) {
      console.error('[Orders] Error fetching vendor orders:', error);
      throw error;
    }
  },

  /**
   * Get specific order details
   */
  async getDetails(orderId) {
    if (!orderId) throw new ValidationError('Order ID is required');
    
    try {
      const response = await apiClient.get(`/vendor/orders/${orderId}`);
      return normalizeSingle(response);
    } catch (error) {
      console.error(`[Orders] Error fetching ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Mark order as fulfilled
   */
  async fulfill(orderId) {
    if (!orderId) throw new ValidationError('Order ID is required');
    
    try {
      const response = await apiClient.post(`/vendor/orders/${orderId}/fulfill`, {});
      return normalizeSingle(response);
    } catch (error) {
      console.error(`[Orders] Error fulfilling ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Cancel order
   */
  async cancel(orderId, reason = '') {
    if (!orderId) throw new ValidationError('Order ID is required');
    
    try {
      const response = await apiClient.post(`/vendor/orders/${orderId}/cancel`, { reason });
      return normalizeSingle(response);
    } catch (error) {
      console.error(`[Orders] Error cancelling ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Add tracking information
   */
  async addTracking(orderId, trackingData) {
    if (!orderId) throw new ValidationError('Order ID is required');
    if (!trackingData.trackingNumber) throw new ValidationError('Tracking number is required');
    
    try {
      const response = await apiClient.post(`/vendor/orders/${orderId}/tracking`, trackingData);
      return normalizeSingle(response);
    } catch (error) {
      console.error(`[Orders] Error adding tracking for ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Get vendor sales analytics
   */
  async getAnalytics() {
    try {
      const response = await apiClient.get('/vendor/orders/analytics');
      return normalizeResponse(response);
    } catch (error) {
      console.error('[Orders] Error fetching analytics:', error);
      throw error;
    }
  }
};

// ============================================================================
// INVENTORY OPERATIONS
// ============================================================================

const inventory = {
  /**
   * Update inventory for variant
   */
  async updateVariant(productId, variantIndex, quantity) {
    if (!productId) throw new ValidationError('Product ID is required');
    if (variantIndex === undefined) throw new ValidationError('Variant index is required');
    if (typeof quantity !== 'number' || quantity < 0) {
      throw new ValidationError('Quantity must be a non-negative number');
    }

    try {
      const response = await apiClient.patch(`/inventory/${productId}/variants/${variantIndex}`, { quantity });
      return normalizeSingle(response);
    } catch (error) {
      console.error(`[Inventory] Error updating variant ${variantIndex}:`, error);
      throw error;
    }
  },

  /**
   * Bulk update inventory
   */
  async bulkUpdate(updates) {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new ValidationError('Updates must be a non-empty array');
    }

    // Validate each update
    for (const update of updates) {
      if (!update.productId) throw new ValidationError('productId is required in each update');
      if (update.variantIndex === undefined) throw new ValidationError('variantIndex is required');
      if (typeof update.quantity !== 'number' || update.quantity < 0) {
        throw new ValidationError('Quantity must be non-negative');
      }
    }

    try {
      const response = await apiClient.post('/inventory/bulk-update', { updates });
      return normalizeArray(response);
    } catch (error) {
      console.error('[Inventory] Error bulk updating:', error);
      throw error;
    }
  }
};

// ============================================================================
// CATEGORIES OPERATIONS
// ============================================================================

const categories = {
  /**
   * Get all categories
   */
  async getAll() {
    try {
      const response = await apiClient.get('/categories');
      return normalizeArray(response);
    } catch (error) {
      console.error('[Categories] Error fetching all:', error);
      throw error;
    }
  },

  /**
   * Get category by ID
   */
  async getById(categoryId) {
    if (!categoryId) throw new ValidationError('Category ID is required');
    
    try {
      const response = await apiClient.get(`/categories/${categoryId}`);
      return normalizeSingle(response);
    } catch (error) {
      console.error(`[Categories] Error fetching ${categoryId}:`, error);
      throw error;
    }
  }
};

// ============================================================================
// REVIEWS OPERATIONS
// ============================================================================

const reviews = {
  /**
   * Get reviews for product
   */
  async getForProduct(productId, filters = {}) {
    if (!productId) throw new ValidationError('Product ID is required');
    
    try {
      const queryParams = new URLSearchParams({ product_id: productId });
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.offset) queryParams.append('offset', filters.offset);

      const response = await apiClient.get(`/reviews?${queryParams}`);
      return normalizeArray(response);
    } catch (error) {
      console.error(`[Reviews] Error fetching for product ${productId}:`, error);
      throw error;
    }
  },

  /**
   * Create review
   */
  async create(data) {
    const requiredFields = ['product_id', 'rating', 'comment'];
    const constraints = {
      rating: { min: 1, max: 5 },
      comment: { minLength: 3, maxLength: 1000 }
    };

    try {
      const response = await apiClient.postValidated('/reviews', data, requiredFields, constraints);
      return normalizeSingle(response);
    } catch (error) {
      console.error('[Reviews] Error creating:', error);
      throw error;
    }
  }
};

// ============================================================================
// DASHBOARD OPERATIONS
// ============================================================================

const dashboard = {
  /**
   * Get vendor dashboard data
   */
  async getVendorData(vendorId) {
    if (!vendorId) throw new ValidationError('Vendor ID is required');
    
    try {
      const response = await apiClient.get(`/dashboard/vendor/${vendorId}`);
      return normalizeResponse(response);
    } catch (error) {
      console.error(`[Dashboard] Error fetching vendor data for ${vendorId}:`, error);
      throw error;
    }
  }
};

// ============================================================================
// MAIN DATA OPERATIONS OBJECT
// ============================================================================

const dataOps = {
  products,
  vendors,
  orders,
  inventory,
  categories,
  reviews,
  dashboard,
  
  // Direct access to API client for custom operations
  client: apiClient
};

// ============================================================================
// EXPORTS
// ============================================================================

export default dataOps;
export {
  products,
  vendors,
  orders,
  inventory,
  categories,
  reviews,
  dashboard,
  normalizeResponse,
  normalizeArray,
  normalizeSingle
};
