/**
 * Server-Side Environment Configuration
 * 
 * Centralized configuration for all server environment variables.
 * This eliminates hard-coded localhost URLs in server code.
 * 
 * Usage: import { SERVER_CONFIG } from './config.js'
 */

export const SERVER_CONFIG = {
  // Server port
  port: parseInt(process.env.PORT || '3001'),
  
  // Node environment
  environment: process.env.NODE_ENV || 'development',
  
  // Frontend URLs (for CORS and redirects)
  frontend: {
    urls: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://skn.onrender.com',
      'https://skn-2.onrender.com',
      process.env.FRONTEND_URL,
      process.env.VITE_FRONTEND_URL
    ].filter(Boolean)
  },
  
  // Backend configuration
  backend: {
    url: process.env.BACKEND_URL || `http://localhost:3001`
  },
  
  // API endpoints
  api: {
    baseUrl: process.env.VITE_API_URL || 'http://localhost:3001'
  }
};

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: process.env.VITE_SUPABASE_URL || '',
  anonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
};

// PayPal Configuration
export const PAYPAL_CONFIG = {
  clientId: process.env.VITE_PAYPAL_CLIENT_ID || '',
  secret: process.env.VITE_PAYPAL_SECRET || '',
  mode: process.env.VITE_PAYPAL_MODE || 'sandbox',
  currency: process.env.VITE_PAYPAL_CURRENCY || 'USD'
};

// Validation
export const validateServerConfig = () => {
  const errors = [];
  
  if (!SUPABASE_CONFIG.url) {
    errors.push('Missing VITE_SUPABASE_URL');
  }
  
  if (!SUPABASE_CONFIG.anonKey) {
    errors.push('Missing VITE_SUPABASE_ANON_KEY');
  }
  
  if (!SUPABASE_CONFIG.serviceRoleKey) {
    errors.push('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:', errors);
    // Don't exit, let the app start but log warnings
  }
  
  return errors;
};

// Debug output
if (process.env.DEBUG_CONFIG === 'true') {
  console.log('Server Configuration:', {
    port: SERVER_CONFIG.port,
    environment: SERVER_CONFIG.environment,
    frontendUrls: SERVER_CONFIG.frontend.urls,
    supabaseUrl: SUPABASE_CONFIG.url ? '✓ Configured' : '✗ Missing',
    paypalEnabled: !!PAYPAL_CONFIG.clientId
  });
}
