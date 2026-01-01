/**
 * ============================================================================
 * UNIFIED DATA LAYER
 * ============================================================================
 * 
 * Bulletproof data operations for all fetch/update operations.
 * Ensures consistency, validation, error handling across the entire app.
 * 
 * DESIGN PRINCIPLES:
 * 1. Single source of truth for all data operations
 * 2. Automatic validation and error handling
 * 3. Consistent response format across all operations
 * 4. Built-in retry logic for transient failures
 * 5. Proper authorization checks before operations
 * 6. Complete logging for debugging
 * 7. Works with both direct Supabase and backend API calls
 */

import { supabase } from '../lib/customSupabaseClient.js';
import { API_CONFIG } from '../config/environment.js';

// ============================================================================
// RESPONSE STANDARDIZATION
// ============================================================================

/**
 * Standard response format - ALL operations return this
 */
const createResponse = (success, data, error = null, metadata = {}) => ({
  success,
  data: success ? data : null,
  error: error ? {
    message: typeof error === 'string' ? error : error?.message || 'Unknown error',
    code: error?.code || error?.status || 'UNKNOWN',
    details: typeof error === 'object' ? error : null
  } : null,
  metadata: {
    timestamp: new Date().toISOString(),
    ...metadata
  }
});

/**
 * Normalize array responses from Supabase
 */
const normalizeArray = (response, key = 'data') => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return Array.isArray(response[key]) ? response[key] : [];
};

/**
 * Normalize single item responses
 */
const normalizeSingle = (response, key = 'data') => {
  if (!response) return null;
  if (Array.isArray(response)) return response[0] || null;
  if (typeof response === 'object' && response[key]) return response[key];
  return response;
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

const VALIDATION_RULES = {
  product: {
    title: { min: 3, max: 255 },
    description: { max: 5000 },
    base_price: { min: 0, type: 'number' },
    inventory_quantity: { min: 0, type: 'number' }
  },
  vendor: {
    name: { min: 2, max: 255 },
    description: { max: 1000 },
    location: { max: 255 }
  },
  order: {
    status: { enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] }
  }
};

/**
 * Validate data against rules
 */
const validate = (data, entityType) => {
  const rules = VALIDATION_RULES[entityType];
  if (!rules) return { valid: true, errors: [] };

  const errors = [];

  for (const [field, value] of Object.entries(data)) {
    if (!(field in rules)) continue; // Skip fields without rules
    const rule = rules[field];

    // Type check
    if (rule.type && typeof value !== rule.type) {
      errors.push(`${field} must be ${rule.type}, got ${typeof value}`);
      continue;
    }

    // Min length
    if (rule.min !== undefined && typeof value === 'string' && value.length < rule.min) {
      errors.push(`${field} must be at least ${rule.min} characters`);
    }

    // Max length
    if (rule.max !== undefined && typeof value === 'string' && value.length > rule.max) {
      errors.push(`${field} cannot exceed ${rule.max} characters`);
    }

    // Min value (for numbers)
    if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
      errors.push(`${field} must be at least ${rule.min}`);
    }

    // Enum check
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
};

// ============================================================================
// AUTHORIZATION CHECKS
// ============================================================================

/**
 * Get current user from auth context
 */
const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (err) {
    console.error('[DataLayer] Failed to get current user:', err);
    return null;
  }
};

/**
 * Check if user owns the vendor
 */
const checkVendorOwnership = async (vendorId, userId) => {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('owner_id')
      .eq('id', vendorId)
      .single();

    if (error) throw error;
    return data?.owner_id === userId;
  } catch (err) {
    console.error('[DataLayer] Failed to check vendor ownership:', err);
    return false;
  }
};

/**
 * Check if user owns the product
 */
const checkProductOwnership = async (productId, userId) => {
  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', productId)
      .single();

    if (productError) throw productError;

    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('owner_id')
      .eq('id', product.vendor_id)
      .single();

    if (vendorError) throw vendorError;
    return vendor?.owner_id === userId;
  } catch (err) {
    console.error('[DataLayer] Failed to check product ownership:', err);
    return false;
  }
};

// ============================================================================
// API CALL WRAPPER
// ============================================================================

/**
 * Make API calls with proper error handling
 */
const apiCall = async (method, endpoint, data = null) => {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    // Add auth token if available
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      options.headers.Authorization = `Bearer ${session.access_token}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const url = `${API_CONFIG.baseURL}${endpoint}`;
    console.log(`[DataLayer API] ${method} ${url}`);

    const response = await fetch(url, options);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText };
      }
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[DataLayer API] Error:`, error);
    throw error;
  }
};

// ============================================================================
// PRODUCTS OPERATIONS
// ============================================================================

export const products = {
  /**
   * Fetch all products with filters
   */
  async getAll(filters = {}) {
    try {
      const { sellerId, categoryId, searchQuery, priceRange, sortBy = 'newest', page = 1, limit = 24 } = filters;

      const params = new URLSearchParams();
      if (sellerId) params.append('sellerId', sellerId);
      if (categoryId) params.append('categoryId', categoryId);
      if (searchQuery) params.append('searchQuery', searchQuery);
      if (priceRange) params.append('priceRange', priceRange);
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', page);
      params.append('limit', limit);

      const response = await apiCall('GET', `/products?${params}`);
      return createResponse(true, {
        products: normalizeArray(response.products),
        total: response.total || 0,
        page: response.page || 1
      });
    } catch (error) {
      console.error('[DataLayer] Products.getAll failed:', error);
      return createResponse(false, null, error);
    }
  },

  /**
   * Fetch single product
   */
  async getById(productId) {
    try {
      if (!productId) throw new Error('Product ID is required');

      const response = await apiCall('GET', `/products/${productId}`);
      return createResponse(true, normalizeSingle(response));
    } catch (error) {
      console.error('[DataLayer] Products.getById failed:', error);
      return createResponse(false, null, error);
    }
  },

  /**
   * Create new product
   */
  async create(data) {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      // Validate data
      const { valid, errors } = validate(data, 'product');
      if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);

      // Sanitize data
      const sanitized = {
        title: data.title?.trim(),
        description: data.description?.trim(),
        base_price: Number(data.base_price) || 0,
        category_id: data.category_id,
        vendor_id: data.vendor_id,
        ...Object.fromEntries(
          Object.entries(data).filter(([key]) => !['title', 'description', 'base_price', 'category_id', 'vendor_id'].includes(key))
        )
      };

      const response = await apiCall('POST', '/products', sanitized);
      return createResponse(true, normalizeSingle(response));
    } catch (error) {
      console.error('[DataLayer] Products.create failed:', error);
      return createResponse(false, null, error);
    }
  },

  /**
   * Update existing product
   */
  async update(productId, data) {
    try {
      if (!productId) throw new Error('Product ID is required');

      const user = await getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      // Check ownership
      const isOwner = await checkProductOwnership(productId, user.id);
      if (!isOwner) throw new Error('You do not have permission to update this product');

      // Validate data
      const { valid, errors } = validate(data, 'product');
      if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);

      // Sanitize data
      const sanitized = Object.fromEntries(
        Object.entries(data)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
      );

      const response = await apiCall('PATCH', `/vendor/products/${productId}`, sanitized);
      return createResponse(true, normalizeSingle(response.product || response));
    } catch (error) {
      console.error('[DataLayer] Products.update failed:', error);
      return createResponse(false, null, error);
    }
  },

  /**
   * Delete product
   */
  async delete(productId) {
    try {
      if (!productId) throw new Error('Product ID is required');

      const user = await getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      // Check ownership
      const isOwner = await checkProductOwnership(productId, user.id);
      if (!isOwner) throw new Error('You do not have permission to delete this product');

      await apiCall('DELETE', `/products/${productId}`);
      return createResponse(true, { deleted: true });
    } catch (error) {
      console.error('[DataLayer] Products.delete failed:', error);
      return createResponse(false, null, error);
    }
  }
};

// ============================================================================
// VENDORS OPERATIONS
// ============================================================================

export const vendors = {
  /**
   * Fetch all vendors
   */
  async getAll(limit = 10) {
    try {
      const params = new URLSearchParams({ limit });
      const response = await apiCall('GET', `/vendors?${params}`);
      return createResponse(true, normalizeArray(response));
    } catch (error) {
      console.error('[DataLayer] Vendors.getAll failed:', error);
      return createResponse(false, null, error);
    }
  },

  /**
   * Fetch vendor by owner
   */
  async getByOwner(userId) {
    try {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('owner_id', userId)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return createResponse(true, data);
    } catch (error) {
      console.error('[DataLayer] Vendors.getByOwner failed:', error);
      return createResponse(false, null, error);
    }
  },

  /**
   * Update vendor
   */
  async update(vendorId, data) {
    try {
      if (!vendorId) throw new Error('Vendor ID is required');

      const user = await getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      // Check ownership
      const isOwner = await checkVendorOwnership(vendorId, user.id);
      if (!isOwner) throw new Error('You do not have permission to update this vendor');

      // Validate data
      const { valid, errors } = validate(data, 'vendor');
      if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);

      // Sanitize data
      const sanitized = Object.fromEntries(
        Object.entries(data)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
      );

      const { data: updated, error } = await supabase
        .from('vendors')
        .update(sanitized)
        .eq('id', vendorId)
        .select()
        .single();

      if (error) throw error;
      return createResponse(true, updated);
    } catch (error) {
      console.error('[DataLayer] Vendors.update failed:', error);
      return createResponse(false, null, error);
    }
  }
};

// ============================================================================
// ORDERS OPERATIONS
// ============================================================================

export const orders = {
  /**
   * Fetch vendor orders
   */
  async getVendorOrders(limit = 50) {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      const params = new URLSearchParams({ limit });
      const response = await apiCall('GET', `/vendor/orders?${params}`);
      return createResponse(true, normalizeArray(response.orders));
    } catch (error) {
      console.error('[DataLayer] Orders.getVendorOrders failed:', error);
      return createResponse(false, null, error);
    }
  },

  /**
   * Fulfill order
   */
  async fulfill(orderId) {
    try {
      if (!orderId) throw new Error('Order ID is required');

      const user = await getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      const response = await apiCall('POST', `/vendor/orders/${orderId}/fulfill`, {});
      return createResponse(true, normalizeSingle(response));
    } catch (error) {
      console.error('[DataLayer] Orders.fulfill failed:', error);
      return createResponse(false, null, error);
    }
  },

  /**
   * Cancel order
   */
  async cancel(orderId) {
    try {
      if (!orderId) throw new Error('Order ID is required');

      const user = await getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      const response = await apiCall('POST', `/vendor/orders/${orderId}/cancel`, {});
      return createResponse(true, normalizeSingle(response));
    } catch (error) {
      console.error('[DataLayer] Orders.cancel failed:', error);
      return createResponse(false, null, error);
    }
  }
};

// ============================================================================
// INVENTORY OPERATIONS
// ============================================================================

export const inventory = {
  /**
   * Update inventory
   */
  async update(productId, variantId, quantity) {
    try {
      if (!productId) throw new Error('Product ID is required');
      if (typeof quantity !== 'number' || quantity < 0) {
        throw new Error('Quantity must be a non-negative number');
      }

      const user = await getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      // Check ownership
      const isOwner = await checkProductOwnership(productId, user.id);
      if (!isOwner) throw new Error('You do not have permission to update this inventory');

      const response = await apiCall('PATCH', `/inventory/${productId}`, {
        variant_id: variantId,
        quantity
      });

      return createResponse(true, normalizeSingle(response));
    } catch (error) {
      console.error('[DataLayer] Inventory.update failed:', error);
      return createResponse(false, null, error);
    }
  }
};

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Execute multiple operations in sequence with error tracking
 */
export async function executeBatch(operations) {
  const results = [];
  const errors = [];

  for (const op of operations) {
    try {
      const result = await op.execute();
      results.push({ success: true, data: result, operation: op.name });
    } catch (error) {
      errors.push({ operation: op.name, error });
      if (op.stopOnError) break; // Stop batch if critical operation fails
    }
  }

  return createResponse(errors.length === 0, {
    results,
    errors,
    total: operations.length,
    successful: results.length
  });
}

/**
 * Retry operation with exponential backoff
 */
export async function executeWithRetry(operation, maxRetries = 3, baseDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[DataLayer] Attempt ${attempt + 1}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`[DataLayer] Attempt ${attempt + 1} failed:`, error.message);

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

export default {
  products,
  vendors,
  orders,
  inventory,
  executeBatch,
  executeWithRetry,
  validate,
  createResponse
};
