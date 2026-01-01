/**
 * Global Environment Configuration
 * 
 * Centralized, unified configuration for all environment variables and defaults.
 * Replicates the PayPal pattern globally: env var fallbacks, validation, safe defaults.
 * 
 * Pattern: 
 * 1. Check VITE_* prefixed vars first (frontend build time), then fallback to non-prefixed (runtime)
 * 2. Provide sensible defaults to prevent runtime errors
 * 3. Validate configuration at startup and log issues (redact secrets)
 * 4. No hard-coded localhost or production URLs in feature code
 */

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

// Detect if running in development (Vite dev server)
const isDevelopment = import.meta.env.DEV;

// Detect if running on a Render-like deployment (or other cloud providers)
// On Render, VITE_API_URL will be set to the backend service URL
// Locally, it's either not set or points to localhost
const isDeployedOnRender = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  // If VITE_API_URL is set to a non-localhost URL, we're deployed
  return apiUrl && !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1');
};

// ============================================================================
// HELPER: UNIFIED ENV VAR GETTER with fallback pattern
// ============================================================================
// Check VITE_ prefixed first (build-time), then non-prefixed (runtime)
const getEnvVar = (viteKey, nonViteKey) => {
  return import.meta.env[viteKey] || import.meta.env[nonViteKey] || '';
};

// Redact secrets in logs (show first 8 and last 4 chars)
const redactSecret = (value) => {
  if (!value || value.length <= 12) return value ? '***' : '';
  return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`;
};

// ============================================================================
// API CONFIGURATION
// ============================================================================
export const API_CONFIG = {
  // Backend API base URL
  // - Local dev (Vite): use relative '/api' path (proxied by Vite to http://localhost:3001)
  // - Deployed (Render): use full URL from VITE_API_URL environment variable
  // - Fallback: use full localhost URL
  // Local dev: use the Vite proxy path '/api'
  // Deployed: use the backend root from VITE_API_URL and append '/api' so
  // frontend requests like `${API_CONFIG.baseURL}/onboarding/me` map to
  // `https://backend.example.com/api/onboarding/me` (server mounts under /api)
  baseURL: (function () {
    if (isDevelopment && !isDeployedOnRender()) return '/api';
    
    const viteApiUrl = import.meta.env.VITE_API_URL || '';
    
    // If VITE_API_URL is already the proxy path '/api', use it as-is
    if (viteApiUrl === '/api') return '/api';
    
    // If VITE_API_URL is a full URL, append '/api' if not already present
    if (viteApiUrl && viteApiUrl.startsWith('http')) {
      const backendRoot = viteApiUrl.replace(/\/$/, '');
      if (backendRoot.endsWith('/api')) return backendRoot;
      return `${backendRoot}/api`;
    }
    
    // Fallback: use localhost:3001 and append /api
    const backendRoot = 'http://localhost:3001'.replace(/\/$/, '');
    return `${backendRoot}/api`;
  })(),
  
  // Request timeout in milliseconds
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  
  // Enable debug logging
  debug: import.meta.env.VITE_API_DEBUG === 'true',
  
  // Full backend root URL (without trailing /api)
  fullURL: (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')
};

// Detect misconfigured API URL in production builds (points to localhost)
// If the production build has VITE_API_URL left as localhost, we should
// avoid trying to reach the developer machine from the deployed frontend.
export const IS_API_LOCAL_IN_PRODUCTION = !isDevelopment && API_CONFIG.baseURL.includes('localhost');

// ============================================================================
// FRONTEND CONFIGURATION
// ============================================================================
export const FRONTEND_CONFIG = {
  // Frontend URL for internal links and redirects
  url: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000',
  
  // Port (for development)
  port: parseInt(import.meta.env.VITE_FRONTEND_PORT || '3000'),
  
  // Environment name
  env: import.meta.env.MODE || 'development'
};

// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
};

// ============================================================================
// PAYPAL CONFIGURATION (using unified env var fallback pattern)
// ============================================================================
export const PAYPAL_CONFIG = {
  clientId: getEnvVar('VITE_PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_ID'),
  secret: getEnvVar('VITE_PAYPAL_SECRET', 'PAYPAL_SECRET'),
  mode: import.meta.env.VITE_PAYPAL_MODE || 'sandbox',
  currency: import.meta.env.VITE_PAYPAL_CURRENCY || 'USD'
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================
export const FEATURE_FLAGS = {
  // Enable PayPal integration
  enablePayPal: !!(PAYPAL_CONFIG.clientId && PAYPAL_CONFIG.secret),
  
  // Enable KYC flow
  enableKYC: import.meta.env.VITE_ENABLE_KYC !== 'false',
  
  // Enable seller onboarding
  // Disable onboarding automatically if the API would target localhost in production
  enableSellerOnboarding: (import.meta.env.VITE_ENABLE_SELLER_ONBOARDING !== 'false') && !IS_API_LOCAL_IN_PRODUCTION,
  
  // Enable debug mode
  debug: import.meta.env.VITE_DEBUG === 'true',
  
  // Development mode
  isDevelopment
};

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================
export const validateConfig = () => {
  const errors = [];
  const warnings = [];
  
  // Required: Supabase
  if (!SUPABASE_CONFIG.url) {
    errors.push('Missing VITE_SUPABASE_URL');
  }
  
  if (!SUPABASE_CONFIG.anonKey) {
    errors.push('Missing VITE_SUPABASE_ANON_KEY');
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
  if (!FRONTEND_CONFIG.url || FRONTEND_CONFIG.url.includes('localhost')) {
    warnings.push('Using localhost for frontend URL (development mode)');
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
const logConfigStartup = () => {
  // Log environment detection
  console.info('[Environment] isDevelopment:', isDevelopment);
  console.info('[Environment] isDeployed:', isDeployedOnRender());
  console.info('[Environment] API URL:', API_CONFIG.baseURL);
  
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
  const { errors, warnings } = validateConfig();
  if (errors.length > 0) {
    console.error('Configuration validation failed:', errors);
  } else {
    console.info('✅ Configuration valid');
  }
};

// Run startup checks if in debug mode or development
if (FEATURE_FLAGS.debug || isDevelopment) {
  logConfigStartup();
}

// If we've detected a production build that would call localhost for the API,
// log an explicit warning so deployers can fix their environment variables.
if (IS_API_LOCAL_IN_PRODUCTION) {
  console.warn('⚠️ Detected API base URL pointing to localhost in a production build.');
  console.warn('This will disable seller onboarding in the frontend to avoid attempting to reach your local machine.');
  console.warn('Set VITE_API_URL to your backend URL (for example, https://backend.example.com) in the deployment environment and rebuild the site.');
}

// ============================================================================
// DEBUG OUTPUT (verbose logging when enabled)
// ============================================================================
if (FEATURE_FLAGS.debug) {
  console.debug('Full App Configuration:', {
    api: API_CONFIG,
    frontend: FRONTEND_CONFIG,
    supabase: {
      url: SUPABASE_CONFIG.url,
      hasAnonKey: !!SUPABASE_CONFIG.anonKey
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
