# Unified Configuration Pattern

## Overview

The application now uses a **unified, global configuration pattern** replicated from the PayPal implementation across both frontend and backend.

This ensures:
- ✅ Consistent environment variable handling everywhere
- ✅ Safe fallbacks with sensible defaults
- ✅ Clear validation and startup logging
- ✅ Redacted secrets in console output
- ✅ Support for both build-time and runtime env vars
- ✅ Development and production awareness

## Pattern Details

### 1. Unified Environment Variable Getter

Instead of accessing env vars directly with different naming conventions, use the unified getter:

```javascript
// Frontend: check VITE_* prefixed first (build-time), then fallback
const getEnvVar = (viteKey, nonViteKey) => {
  return import.meta.env[viteKey] || import.meta.env[nonViteKey] || '';
};

// Server: check non-prefixed first (runtime), then VITE_* (from frontend build)
const getEnvVar = (nonViteKey, viteKey) => {
  return process.env[nonViteKey] || process.env[viteKey] || '';
};

// Usage
export const PAYPAL_CONFIG = {
  clientId: getEnvVar('VITE_PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_ID'),
  secret: getEnvVar('VITE_PAYPAL_SECRET', 'PAYPAL_SECRET')
};
```

### 2. Secret Redaction

Sensitive values (API keys, secrets) are automatically redacted in logs:

```javascript
const redactSecret = (value) => {
  if (!value || value.length <= 12) return value ? '***' : '';
  return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`;
};

// Shows: "Ae9aWcPW...fcZ6"
// Doesn't expose: full client ID
```

### 3. Startup Validation & Logging

All configuration is validated and logged when the app starts:

```javascript
// Frontend console output
[Environment] isDevelopment: true
[Environment] isDeployed: false
[Environment] API URL: /api
[PayPal] Configured: {
  clientId: 'Ae9aWcPW...fcZ6',
  mode: 'sandbox',
  currency: 'USD'
}
✅ Configuration valid

// Server console output
[Server] Environment: development
[Server] Port: 3001
[Server] Frontend URLs: [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://skn-2.onrender.com'
]
[Supabase] Configured: {
  url: 'https://tmyxjsqhtt...',
  hasAnonKey: true,
  hasServiceRole: true
}
[PayPal] Configured: {
  clientId: 'Ae9aWcPW...fcZ6',
  mode: 'sandbox',
  currency: 'USD'
}
✅ Configuration valid
```

### 4. Feature Flags

Configuration is automatically converted to feature flags:

```javascript
export const FEATURE_FLAGS = {
  enablePayPal: !!(PAYPAL_CONFIG.clientId && PAYPAL_CONFIG.secret),
  enableKYC: process.env.VITE_ENABLE_KYC !== 'false',
  enableSellerOnboarding: process.env.VITE_ENABLE_SELLER_ONBOARDING !== 'false',
  debug: process.env.DEBUG_CONFIG === 'true'
};

// Usage in code
if (FEATURE_FLAGS.enablePayPal) {
  // PayPal integration available
}
```

### 5. Safe Defaults

All configuration has sensible defaults to prevent runtime errors:

```javascript
// No env var? Uses default
const port = parseInt(process.env.PORT || '3001');  // Defaults to 3001
const mode = process.env.PAYPAL_MODE || 'sandbox';   // Defaults to sandbox (safe)
const env = process.env.NODE_ENV || 'development';   // Defaults to dev (safe)

// No URL? Falls back gracefully
const baseURL = isDevelopment ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');
```

## Frontend Configuration (`src/config/environment.js`)

### Usage
```javascript
import { API_CONFIG, PAYPAL_CONFIG, SUPABASE_CONFIG, FEATURE_FLAGS } from '@/config/environment';

// Use API base URL
fetch(`${API_CONFIG.baseURL}/onboarding/me`, { /* ... */ });

// Check if PayPal is available
if (FEATURE_FLAGS.enablePayPal) {
  // show PayPal button
}

// Get frontend URL
const frontendUrl = FRONTEND_CONFIG.url;
```

### Exported Values
- `API_CONFIG` - API base URL, timeout, debug flag
- `FRONTEND_CONFIG` - Frontend URL, port, environment name
- `SUPABASE_CONFIG` - Supabase credentials (url, anonKey)
- `PAYPAL_CONFIG` - PayPal credentials and settings
- `FEATURE_FLAGS` - Feature flags derived from config
- `validateConfig()` - Function to validate and get errors

## Server Configuration (`server/config.js`)

### Usage
```javascript
import { SERVER_CONFIG, PAYPAL_CONFIG, SUPABASE_CONFIG, FEATURE_FLAGS, logConfigStartup } from './config.js';

// Use server config
const port = SERVER_CONFIG.port;
const frontendUrls = SERVER_CONFIG.frontend.urls;

// Check if PayPal is configured
if (FEATURE_FLAGS.enablePayPal) {
  // initialize PayPal
}

// Log startup
logConfigStartup();
```

### Exported Values
- `SERVER_CONFIG` - Port, environment, frontend URLs
- `SUPABASE_CONFIG` - Supabase credentials
- `PAYPAL_CONFIG` - PayPal credentials and settings
- `FEATURE_FLAGS` - Feature flags derived from config
- `validateServerConfig()` - Function to validate and get errors/warnings
- `logConfigStartup()` - Function to log all config to console

## Environment Variables Reference

### Build-Time (Vite - `.env` file)
```dotenv
# API
VITE_API_URL=http://localhost:3001
VITE_API_TIMEOUT=30000
VITE_API_DEBUG=false

# Frontend
VITE_FRONTEND_URL=http://localhost:3000
VITE_FRONTEND_PORT=3000

# Supabase
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...

# PayPal
VITE_PAYPAL_CLIENT_ID=Ae9aWcPW...
VITE_PAYPAL_SECRET=EBK2vfhq...
VITE_PAYPAL_MODE=sandbox
VITE_PAYPAL_CURRENCY=USD

# Features
VITE_ENABLE_KYC=true
VITE_ENABLE_SELLER_ONBOARDING=true
VITE_DEBUG=false
```

### Runtime (Server - `.env` or system)
```dotenv
# Server
NODE_ENV=development
PORT=3001

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:3000

# Supabase
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# PayPal
PAYPAL_CLIENT_ID=Ae9aWcPW...
PAYPAL_SECRET=EBK2vfhq...
PAYPAL_MODE=sandbox
PAYPAL_CURRENCY=USD
PAYPAL_WEBHOOK_ID=4S600542DM...

# Features
VITE_ENABLE_KYC=true
VITE_ENABLE_SELLER_ONBOARDING=true
DEBUG_CONFIG=false
```

## Development vs Production

### Development
```
isDevelopment: true
API_CONFIG.baseURL: /api
PAYPAL_CONFIG.mode: sandbox
Environment: development
NODE_ENV: development
```

### Production (Render)
```
isDevelopment: false
API_CONFIG.baseURL: https://backend.onrender.com
PAYPAL_CONFIG.mode: live
Environment: production
NODE_ENV: production
```

## Example: Adding New Configuration

To add a new service (e.g., Stripe) to the configuration:

### 1. Update Frontend Config (`src/config/environment.js`)
```javascript
export const STRIPE_CONFIG = {
  publishableKey: getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY'),
  secretKey: getEnvVar('VITE_STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY'),
  mode: import.meta.env.VITE_STRIPE_MODE || 'test'
};

// Add to feature flags
export const FEATURE_FLAGS = {
  // ... other flags
  enableStripe: !!(STRIPE_CONFIG.publishableKey && STRIPE_CONFIG.secretKey)
};

// Add validation
if (FEATURE_FLAGS.enableStripe && !STRIPE_CONFIG.publishableKey) {
  errors.push('Stripe enabled but missing STRIPE_PUBLISHABLE_KEY');
}
```

### 2. Update Server Config (`server/config.js`)
```javascript
export const STRIPE_CONFIG = {
  publishableKey: getEnvVar('STRIPE_PUBLISHABLE_KEY', 'VITE_STRIPE_PUBLISHABLE_KEY'),
  secretKey: getEnvVar('STRIPE_SECRET_KEY', 'VITE_STRIPE_SECRET_KEY'),
  mode: getEnvVar('STRIPE_MODE', 'VITE_STRIPE_MODE') || 'test'
};

// Same for feature flags and validation
```

### 3. Use It
```javascript
// Frontend
if (FEATURE_FLAGS.enableStripe) {
  const publishableKey = STRIPE_CONFIG.publishableKey;
}

// Server
if (FEATURE_FLAGS.enableStripe) {
  const secretKey = STRIPE_CONFIG.secretKey;
}
```

### 4. Add to `.env`
```dotenv
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
VITE_STRIPE_SECRET_KEY=sk_...
VITE_STRIPE_MODE=test
```

## Best Practices

1. **Always use config objects** - Never hardcode values
   ```javascript
   // ✅ Good
   fetch(`${API_CONFIG.baseURL}/endpoint`, { /* ... */ });
   
   // ❌ Bad
   fetch('http://localhost:3001/endpoint', { /* ... */ });
   ```

2. **Use feature flags** - Check before using a service
   ```javascript
   // ✅ Good
   if (FEATURE_FLAGS.enablePayPal) {
     // render PayPal button
   }
   
   // ❌ Bad
   if (PAYPAL_CONFIG.clientId) {
     // render PayPal button (doesn't check secret)
   }
   ```

3. **Validate early** - Run validation at startup
   ```javascript
   const { errors, warnings } = validateConfig();
   if (errors.length > 0) {
     console.error('Fix these before deploying');
   }
   ```

4. **Redact secrets** - Use the redact function in logs
   ```javascript
   // ✅ Good
   console.log('Key:', redactSecret(PAYPAL_CONFIG.clientId)); // Ae9aWcPW...fcZ6
   
   // ❌ Bad
   console.log('Key:', PAYPAL_CONFIG.clientId); // Ae9aWcPWLr5fWx6VPddjCKl...FULL_KEY
   ```

5. **Support both prefixes** - Use getEnvVar for compatibility
   ```javascript
   // ✅ Good - works with both VITE_ and non-prefixed
   const value = getEnvVar('VITE_KEY', 'KEY');
   
   // ❌ Bad - only works with one
   const value = import.meta.env.VITE_KEY || 'default';
   ```

## Troubleshooting

### "Configuration valid" but feature disabled?
- Check console logs - is the credential actually loaded?
- Verify env var name matches exactly
- Check for typos (PAYAPL vs PAYPAL)
- Restart dev server to reload env vars

### Secret not being redacted?
- Length must be > 12 chars
- Use `redactSecret()` function in logs
- Don't log raw config in production

### Wrong URL being used?
- Check `[Environment] API URL:` log in console
- Verify `VITE_API_URL` is set correctly for your environment
- For Render, set in Render dashboard, not local .env

## Migration Guide

If updating existing code to use this pattern:

1. Import config at top of file
   ```javascript
   import { API_CONFIG, PAYPAL_CONFIG, FEATURE_FLAGS } from '@/config/environment';
   // or server
   import { SERVER_CONFIG, PAYPAL_CONFIG, FEATURE_FLAGS } from './config.js';
   ```

2. Replace hardcoded values with config
   ```javascript
   // Before
   fetch('http://localhost:3001/api/paypal/create-order', { /* ... */ });
   
   // After
   fetch(`${API_CONFIG.baseURL}/paypal/create-order`, { /* ... */ });
   ```

3. Use feature flags instead of checking credentials
   ```javascript
   // Before
   if (PAYPAL_CONFIG.clientId) {
   
   // After
   if (FEATURE_FLAGS.enablePayPal) {
   ```

4. Remove hardcoded URLs
   ```javascript
   // Remove these patterns:
   // const API_URL = 'http://localhost:3001';
   // const FRONTEND_URL = 'http://localhost:3000';
   // Use config instead
   ```

## References

- [Frontend Config](./src/config/environment.js)
- [Server Config](./server/config.js)
- [PayPal Implementation](./server/paypal-orders.js) - Original pattern source
