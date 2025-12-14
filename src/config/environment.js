/**
 * Global Environment Configuration
 * 
 * Centralized configuration for all environment variables and defaults.
 * This eliminates hard-coded values throughout the codebase.
 * 
 * Pattern: All config values use environment variables with sensible defaults.
 * No hard-coded localhost or production URLs should appear in feature code.
 */

// Detect if running in development
const isDevelopment = import.meta.env.DEV;

// API Configuration
export const API_CONFIG = {
  // Backend API base URL
  // In development: use relative path (proxied by Vite)
  // In production: use full URL from environment
  baseURL: isDevelopment ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:3001'),
  
  // Request timeout in milliseconds
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  
  // Enable debug logging
  debug: import.meta.env.VITE_API_DEBUG === 'true',
  
  // Full backend URL (for production APIs that need absolute URLs)
  fullURL: import.meta.env.VITE_API_URL || 'http://localhost:3001'
};

// Frontend Configuration
export const FRONTEND_CONFIG = {
  // Frontend URL for internal links and redirects
  url: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000',
  
  // Port (for development)
  port: parseInt(import.meta.env.VITE_FRONTEND_PORT || '3000'),
  
  // Environment name
  env: import.meta.env.MODE || 'development'
};

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
};

// PayPal Configuration
export const PAYPAL_CONFIG = {
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
  mode: import.meta.env.VITE_PAYPAL_MODE || 'sandbox',
  currency: import.meta.env.VITE_PAYPAL_CURRENCY || 'USD'
};

// Feature Flags
export const FEATURE_FLAGS = {
  // Enable PayPal integration
  enablePayPal: !!import.meta.env.VITE_PAYPAL_CLIENT_ID,
  
  // Enable KYC flow
  enableKYC: import.meta.env.VITE_ENABLE_KYC !== 'false',
  
  // Enable seller onboarding
  enableSellerOnboarding: import.meta.env.VITE_ENABLE_SELLER_ONBOARDING !== 'false',
  
  // Enable debug mode
  debug: import.meta.env.VITE_DEBUG === 'true'
};

// Validation
export const validateConfig = () => {
  const errors = [];
  
  if (!SUPABASE_CONFIG.url) {
    errors.push('Missing VITE_SUPABASE_URL');
  }
  
  if (!SUPABASE_CONFIG.anonKey) {
    errors.push('Missing VITE_SUPABASE_ANON_KEY');
  }
  
  if (FEATURE_FLAGS.enablePayPal && !PAYPAL_CONFIG.clientId) {
    errors.push('PayPal enabled but missing VITE_PAYPAL_CLIENT_ID');
  }
  
  if (errors.length > 0) {
    console.warn('Configuration warnings:', errors);
  }
  
  return errors;
};

// Debug output
if (FEATURE_FLAGS.debug) {
  console.debug('App Configuration:', {
    api: API_CONFIG,
    frontend: FRONTEND_CONFIG,
    features: FEATURE_FLAGS
  });
}
