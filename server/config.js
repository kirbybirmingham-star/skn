/**
 * Server-Side Environment Configuration
 * 
 * Centralized, unified configuration for all server environment variables.
 * Replicates the PayPal pattern globally: env var fallbacks, validation, safe defaults.
 * 
 * Pattern:
 * 1. Check both VITE_* prefixed and non-prefixed env vars (frontend build vs server runtime)
 * 2. Provide sensible defaults to prevent runtime errors
 * 3. Validate configuration at startup and log issues (redact secrets)
 * 4. No hard-coded localhost or production URLs in feature code
 * 
 * Usage: import { SERVER_CONFIG, PAYPAL_CONFIG, etc. } from './config.js'
 */

// ============================================================================
// HELPER: UNIFIED ENV VAR GETTER with fallback pattern
// ============================================================================
// Check non-prefixed first (server runtime), then VITE_* (from frontend build)
const getEnvVar = (nonViteKey, viteKey) => {
  return process.env[nonViteKey] || process.env[viteKey] || '';
};

// Redact secrets in logs (show first 8 and last 4 chars)
const redactSecret = (value) => {
  if (!value || value.length <= 12) return value ? '***' : '';
  return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`;
};

// ============================================================================
// SERVER CONFIGURATION
// ============================================================================
export const SERVER_CONFIG = {
  // Server port
  port: parseInt(process.env.PORT || '3001'),
  
  // Node environment (support both NODE_ENV and legacy VITE_NODE_ENV)
  environment: (process.env.NODE_ENV || process.env.VITE_NODE_ENV || 'development').toLowerCase(),
  
  // Production/development detection
  isProduction: (process.env.NODE_ENV || process.env.VITE_NODE_ENV || 'development').toLowerCase() === 'production',
  isDevelopment: (process.env.NODE_ENV || process.env.VITE_NODE_ENV || 'development').toLowerCase() !== 'production',
  
  // Frontend URLs (for CORS and redirects)
  frontend: {
    urls: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://skn.onrender.com',
      'https://skn-2.onrender.com',
      getEnvVar('FRONTEND_URL', 'VITE_FRONTEND_URL')
    ].filter(Boolean)
  },
  
  // Backend configuration
  backend: {
    url: getEnvVar('BACKEND_URL', 'VITE_API_URL') || 'http://localhost:3001'
  },
  
  // API endpoints
  api: {
    baseUrl: getEnvVar('VITE_API_URL', 'VITE_API_URL') || 'http://localhost:3001'
  }
};

// ============================================================================
// SUPABASE CONFIGURATION (using unified env var fallback pattern)
// ============================================================================
export const SUPABASE_CONFIG = {
  url: getEnvVar('SUPABASE_URL', 'VITE_SUPABASE_URL'),
  anonKey: getEnvVar('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'),
  serviceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', 'VITE_SUPABASE_SERVICE_ROLE_KEY')
};

// ============================================================================
// PAYPAL CONFIGURATION (using unified env var fallback pattern)
// ============================================================================
export const PAYPAL_CONFIG = {
  clientId: getEnvVar('PAYPAL_CLIENT_ID', 'VITE_PAYPAL_CLIENT_ID'),
  secret: getEnvVar('PAYPAL_SECRET', 'VITE_PAYPAL_SECRET'),
  mode: getEnvVar('PAYPAL_MODE', 'VITE_PAYPAL_MODE') || 'sandbox',
  currency: getEnvVar('PAYPAL_CURRENCY', 'VITE_PAYPAL_CURRENCY') || 'USD',
  webhookId: process.env.PAYPAL_WEBHOOK_ID || ''
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================
export const FEATURE_FLAGS = {
  // Enable PayPal integration
  enablePayPal: !!(PAYPAL_CONFIG.clientId && PAYPAL_CONFIG.secret),
  
  // Enable KYC flow
  enableKYC: process.env.VITE_ENABLE_KYC !== 'false',
  
  // Enable seller onboarding
  enableSellerOnboarding: process.env.VITE_ENABLE_SELLER_ONBOARDING !== 'false',
  
  // Enable debug mode
  debug: process.env.DEBUG_CONFIG === 'true' || process.env.VITE_DEBUG === 'true',
  
  // Environment
  isDevelopment: SERVER_CONFIG.isDevelopment,
  isProduction: SERVER_CONFIG.isProduction
};

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================
export const validateServerConfig = () => {
  const errors = [];
  const warnings = [];
  
  // Required: Supabase
  if (!SUPABASE_CONFIG.url) {
    errors.push('Missing VITE_SUPABASE_URL');
  }
  
  if (!SUPABASE_CONFIG.anonKey) {
    errors.push('Missing VITE_SUPABASE_ANON_KEY');
  }
  
  if (!SUPABASE_CONFIG.serviceRoleKey) {
    errors.push('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  
  // Conditional: PayPal (required if enabled)
  if (FEATURE_FLAGS.enablePayPal) {
    if (!PAYPAL_CONFIG.clientId) {
      errors.push('PayPal enabled but missing PAYPAL_CLIENT_ID');
    }
    if (!PAYPAL_CONFIG.secret) {
      errors.push('PayPal enabled but missing PAYPAL_SECRET');
    }
  } else {
    warnings.push('PayPal disabled (missing credentials)');
  }
  
  // Warnings: non-critical config
  if (!SUPABASE_CONFIG.serviceRoleKey) {
    warnings.push('Supabase service role key missing (onboarding features disabled)');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:', errors);
  }
  
  if (warnings.length > 0 && FEATURE_FLAGS.debug) {
    console.warn('⚠️ Configuration warnings:', warnings);
  }
  
  return { errors, warnings };
};

// ============================================================================
// STARTUP LOGGING
// ============================================================================
export const logConfigStartup = () => {
  console.info('[Server] Environment:', SERVER_CONFIG.environment);
  console.info('[Server] Port:', SERVER_CONFIG.port);
  console.info('[Server] Frontend URLs:', SERVER_CONFIG.frontend.urls);
  
  // Log Supabase config (redact secrets)
  if (SUPABASE_CONFIG.url) {
    console.info('[Supabase] Configured:', {
      url: SUPABASE_CONFIG.url.substring(0, 30) + '...',
      hasAnonKey: !!SUPABASE_CONFIG.anonKey,
      hasServiceRole: !!SUPABASE_CONFIG.serviceRoleKey
    });
  } else {
    console.warn('[Supabase] ⚠️ Not configured (missing URL)');
  }
  
  // Log PayPal config (redact secrets)
  if (FEATURE_FLAGS.enablePayPal) {
    console.info('[PayPal] Configured:', {
      clientId: redactSecret(PAYPAL_CONFIG.clientId),
      mode: PAYPAL_CONFIG.mode,
      currency: PAYPAL_CONFIG.currency
    });
  } else {
    console.warn('[PayPal] ⚠️ Not configured (missing credentials)');
  }
  
  // Run validation and log results
  const { errors, warnings } = validateServerConfig();
  if (errors.length > 0) {
    console.error('Configuration validation failed - some features may be disabled');
  } else {
    console.info('✅ Configuration valid');
  }
};

// NOTE: logConfigStartup() is no longer called here - it's called from server/index.js after all initialization is complete

// ============================================================================
// DEBUG OUTPUT (verbose logging when enabled)
// ============================================================================
if (FEATURE_FLAGS.debug) {
  console.debug('[Debug] Full Server Configuration:', {
    server: SERVER_CONFIG,
    supabase: {
      url: SUPABASE_CONFIG.url.substring(0, 30) + '...',
      hasAnonKey: !!SUPABASE_CONFIG.anonKey,
      hasServiceRole: !!SUPABASE_CONFIG.serviceRoleKey
    },
    paypal: {
      clientId: redactSecret(PAYPAL_CONFIG.clientId),
      hasSecret: !!PAYPAL_CONFIG.secret,
      mode: PAYPAL_CONFIG.mode,
      currency: PAYPAL_CONFIG.currency
    },
    features: FEATURE_FLAGS
  });
}
