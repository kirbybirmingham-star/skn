/**
 * ============================================================================
 * DATA LAYER CONFIGURATION
 * ============================================================================
 * 
 * Central configuration for API endpoints and data layer behavior
 */

import { dev } from 'svelte/app';

// Determine environment
const isDevelopment = dev || process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;

// API Base URL
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5173/api'  // Vite dev server
  : 'https://skn-backend.onrender.com/api';  // Production backend

/**
 * API Configuration
 */
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  isDevelopment,
  isProduction
};

/**
 * Endpoint mappings for consistency
 */
export const ENDPOINTS = {
  // Products
  products: {
    getAll: '/products',
    getById: (id) => `/products/${id}`,
    create: '/products',
    update: (id) => `/vendor/products/${id}`,
    delete: (id) => `/products/${id}`
  },

  // Vendors
  vendors: {
    getAll: '/vendors',
    getByOwner: (userId) => `/vendors/owner/${userId}`,
    update: (id) => `/vendors/${id}`
  },

  // Orders
  orders: {
    getVendor: '/vendor/orders',
    fulfill: (id) => `/vendor/orders/${id}/fulfill`,
    cancel: (id) => `/vendor/orders/${id}/cancel`
  },

  // Inventory
  inventory: {
    update: (id) => `/inventory/${id}`
  }
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'The data you provided is invalid.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN: 'An unexpected error occurred.'
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  PRODUCT_CREATED: 'Product created successfully!',
  PRODUCT_UPDATED: 'Product updated successfully!',
  PRODUCT_DELETED: 'Product deleted successfully!',
  VENDOR_UPDATED: 'Vendor information updated successfully!',
  ORDER_FULFILLED: 'Order fulfilled successfully!',
  ORDER_CANCELLED: 'Order cancelled successfully!',
  INVENTORY_UPDATED: 'Inventory updated successfully!'
};

/**
 * Validation rules per entity type
 */
export const VALIDATION_RULES = {
  product: {
    title: { required: true, min: 3, max: 255 },
    description: { required: true, min: 10, max: 5000 },
    base_price: { required: true, min: 0.01, type: 'number' },
    category_id: { required: true, type: 'string' },
    vendor_id: { required: true, type: 'string' },
    inventory_quantity: { required: true, min: 0, type: 'number' }
  },
  vendor: {
    name: { required: true, min: 2, max: 255 },
    description: { required: true, min: 10, max: 1000 },
    location: { max: 255 }
  },
  order: {
    status: { required: true, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] }
  }
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  // Maximum requests per minute
  DEFAULT: 60,
  PRODUCTS: {
    getAll: 30,
    create: 10,
    update: 10,
    delete: 10
  },
  VENDORS: {
    getAll: 30,
    update: 10
  },
  ORDERS: {
    getAll: 30,
    fulfill: 10,
    cancel: 10
  }
};

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  // Enable/disable caching
  enabled: true,
  // TTL in milliseconds
  ttl: {
    products: 5 * 60 * 1000,      // 5 minutes
    vendors: 10 * 60 * 1000,      // 10 minutes
    orders: 2 * 60 * 1000,        // 2 minutes
    inventory: 1 * 60 * 1000      // 1 minute
  }
};

export default {
  API_CONFIG,
  ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES,
  RATE_LIMITS,
  CACHE_CONFIG
};
