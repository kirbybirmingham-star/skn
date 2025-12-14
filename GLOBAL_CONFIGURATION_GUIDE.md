# Global Configuration System

**Date:** December 14, 2025  
**Purpose:** Eliminate hard-coded values throughout the codebase and establish a global configuration standard.

---

## Overview

This document describes the new global configuration system that replaces hard-coded localhost URLs, port numbers, and other environment-dependent values with centralized configuration.

### Why This Matters

- ❌ **Before:** Hard-coded values scattered across 20+ files
  - `'http://localhost:3000'` repeated 10+ times
  - `'http://localhost:3001'` repeated 8+ times
  - Port numbers: `3001`, `3000` scattered throughout
  - Difficult to deploy to different environments
  - Risk of accidentally pushing localhost URLs to production

- ✅ **After:** Centralized configuration
  - Single source of truth for all environment values
  - Environment-aware defaults
  - Easy to deploy to any environment
  - Type-safe configuration with validation

---

## Architecture

### Frontend Configuration: `src/config/environment.js`

Handles all frontend environment variables and feature flags.

```javascript
import { API_CONFIG } from '@/config/environment.js';

// Use the configuration
const response = await fetch(`${API_CONFIG.baseURL}/onboarding/me`);
```

**Exported Objects:**

#### `API_CONFIG`
```javascript
{
  baseURL: 'http://localhost:3001',      // Backend API base URL
  timeout: 30000,                        // Request timeout in ms
  debug: false                           // Enable debug logging
}
```

**Environment Variables:**
- `VITE_API_URL` - Backend API base URL
- `VITE_API_TIMEOUT` - Request timeout (default: 30000ms)
- `VITE_API_DEBUG` - Enable debug mode

#### `FRONTEND_CONFIG`
```javascript
{
  url: 'http://localhost:3000',          // Frontend URL
  port: 3000,                            // Port number
  env: 'development'                     // Environment name
}
```

**Environment Variables:**
- `VITE_FRONTEND_URL` - Frontend URL
- `VITE_FRONTEND_PORT` - Frontend port
- `MODE` - Environment (automatic from Vite)

#### `SUPABASE_CONFIG`
```javascript
{
  url: 'your_supabase_url',
  anonKey: 'your_anon_key',
  serviceRoleKey: 'your_service_role_key'
}
```

#### `PAYPAL_CONFIG`
```javascript
{
  clientId: 'your_client_id',
  mode: 'sandbox',
  currency: 'USD'
}
```

#### `FEATURE_FLAGS`
```javascript
{
  enablePayPal: true,              // PayPal enabled
  enableKYC: true,                 // KYC flow enabled
  enableSellerOnboarding: true,    // Seller onboarding enabled
  debug: false                     // Debug mode
}
```

**Environment Variables:**
- `VITE_PAYPAL_CLIENT_ID` - PayPal client ID
- `VITE_PAYPAL_MODE` - PayPal mode (sandbox/live)
- `VITE_PAYPAL_CURRENCY` - Currency code
- `VITE_ENABLE_KYC` - Enable KYC (default: true)
- `VITE_ENABLE_SELLER_ONBOARDING` - Enable seller onboarding (default: true)
- `VITE_DEBUG` - Enable debug mode

---

### Backend Configuration: `server/config.js`

Handles all backend environment variables.

```javascript
import { SERVER_CONFIG, PAYPAL_CONFIG } from './config.js';

// Use the configuration
const PORT = SERVER_CONFIG.port;
const allowedOrigins = SERVER_CONFIG.frontend.urls;
```

**Exported Objects:**

#### `SERVER_CONFIG`
```javascript
{
  port: 3001,
  environment: 'development',
  frontend: {
    urls: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://skn.onrender.com',
      'https://skn-2.onrender.com',
      // + FRONTEND_URL and VITE_FRONTEND_URL from env
    ]
  },
  backend: {
    url: 'http://localhost:3001'
  },
  api: {
    baseUrl: 'http://localhost:3001'
  }
}
```

**Environment Variables:**
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Node environment (development/production)
- `FRONTEND_URL` - Frontend URL
- `VITE_FRONTEND_URL` - Frontend URL (alternative)
- `VITE_API_URL` - API base URL
- `BACKEND_URL` - Backend URL
- `DEBUG_CONFIG` - Show config debug output

#### `SUPABASE_CONFIG`
```javascript
{
  url: 'your_supabase_url',
  anonKey: 'your_anon_key',
  serviceRoleKey: 'your_service_role_key'
}
```

**Environment Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

#### `PAYPAL_CONFIG`
```javascript
{
  clientId: 'your_client_id',
  secret: 'your_secret',
  mode: 'sandbox',
  currency: 'USD'
}
```

**Environment Variables:**
- `VITE_PAYPAL_CLIENT_ID`
- `VITE_PAYPAL_SECRET`
- `VITE_PAYPAL_MODE`
- `VITE_PAYPAL_CURRENCY`

---

## Migration Guide

### Files Updated

#### Backend Files
- ✅ `server/index.js` - Uses `SERVER_CONFIG.port` and `SERVER_CONFIG.frontend.urls`
- ✅ `server/onboarding.js` - Uses `SERVER_CONFIG.frontend.urls` for URL construction
- ✅ `server/middleware.js` - Uses `SERVER_CONFIG.frontend.urls` for CORS
- ✅ `server/paypal-middleware.js` - Uses `SERVER_CONFIG.frontend.urls` for CORS
- ✅ `server/config.js` - **New** Centralized backend configuration

#### Frontend Files
- ✅ `src/api/EcommerceApi.jsx` - Uses `API_CONFIG.baseURL`
- ✅ `src/pages/OnboardingDashboard.jsx` - Uses `API_CONFIG.baseURL`
- ✅ `src/config/environment.js` - **New** Centralized frontend configuration

### Migration Steps for New Features

When adding a new configuration value:

1. **Add to environment.js** (frontend) or **config.js** (backend)
2. **Define environment variable** in `.env` file
3. **Use the constant** instead of hard-coding the value
4. **Document** the variable in this file

### Example: Adding a New Configuration

**Before (Hard-coded):**
```javascript
// server/myfeature.js
const webhookUrl = 'https://api.example.com/webhook';
const retryCount = 3;
const timeout = 5000;
```

**After (Configured):**

1. Add to `server/config.js`:
```javascript
export const MY_FEATURE_CONFIG = {
  webhookUrl: process.env.WEBHOOK_URL || 'https://api.example.com/webhook',
  retryCount: parseInt(process.env.RETRY_COUNT || '3'),
  timeout: parseInt(process.env.TIMEOUT || '5000')
};
```

2. Add to `.env`:
```
WEBHOOK_URL=https://api.example.com/webhook
RETRY_COUNT=3
TIMEOUT=5000
```

3. Use in code:
```javascript
import { MY_FEATURE_CONFIG } from './config.js';

const webhookUrl = MY_FEATURE_CONFIG.webhookUrl;
const retryCount = MY_FEATURE_CONFIG.retryCount;
const timeout = MY_FEATURE_CONFIG.timeout;
```

---

## Environment-Specific Values

### Development (.env.local or .env)
```
VITE_API_URL=http://localhost:3001
VITE_FRONTEND_URL=http://localhost:3000
PORT=3001
NODE_ENV=development
```

### Staging
```
VITE_API_URL=https://staging-api.onrender.com
VITE_FRONTEND_URL=https://staging.onrender.com
PORT=3001
NODE_ENV=production
```

### Production
```
VITE_API_URL=https://api.skn.com
VITE_FRONTEND_URL=https://skn.com
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://skn.com
```

---

## Validation

Both configuration files include validation functions:

**Frontend:**
```javascript
import { validateConfig } from '@/config/environment.js';

validateConfig(); // Logs warnings for missing required env vars
```

**Backend:**
```javascript
import { validateServerConfig } from './config.js';

validateServerConfig(); // Logs errors for missing required env vars
```

---

## CORS Configuration (Special Case)

CORS is handled globally using `SERVER_CONFIG.frontend.urls`:

```javascript
// server/index.js
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || SERVER_CONFIG.frontend.urls.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

**Benefits:**
- Single list of allowed origins
- Automatically includes all frontend URLs
- Reduces duplication across middleware files
- Easy to add new environments

---

## URL Construction Pattern

When constructing URLs, always use the config values:

**Bad:**
```javascript
const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/endpoint`;
```

**Good:**
```javascript
import { SERVER_CONFIG } from './config.js';

const frontendUrl = SERVER_CONFIG.frontend.urls[0];
const url = `${frontendUrl}/api/endpoint`;
```

**Better (if just checking first URL):**
```javascript
const frontendUrl = SERVER_CONFIG.frontend.urls[0] || 'http://localhost:3000';
const url = `${frontendUrl}/api/endpoint`;
```

---

## Debugging

Enable debug output to see loaded configuration:

**Frontend:**
```bash
VITE_DEBUG=true npm run dev
```

Output:
```
App Configuration: {
  api: { baseURL: '...', timeout: 30000, debug: true },
  frontend: { url: '...', port: 3000, env: 'development' },
  features: { enablePayPal: true, ... }
}
```

**Backend:**
```bash
DEBUG_CONFIG=true npm start
```

Output:
```
Server Configuration: {
  port: 3001,
  environment: development,
  frontendUrls: [...],
  supabaseUrl: ✓ Configured,
  paypalEnabled: true
}
```

---

## Best Practices

1. **Never hard-code URLs or ports** - Use configuration system
2. **Always provide fallbacks** - `process.env.VAR || 'default'`
3. **Validate configuration** - Call validation functions at startup
4. **Document environment variables** - Add to this guide when adding new ones
5. **Use meaningful names** - `VITE_API_URL` not `API_HOST`
6. **Group related values** - Use objects like `API_CONFIG`, `PAYPAL_CONFIG`
7. **Enable debug mode** - When troubleshooting environment issues

---

## Common Issues & Solutions

### Issue: 404 on /api/onboarding/me

**Cause:** Frontend making requests to wrong API endpoint

**Solution:** Ensure `API_CONFIG.baseURL` points to backend
```javascript
// Check in browser console:
console.log(API_CONFIG.baseURL);
// Should be: http://localhost:3001 or your backend URL
```

### Issue: CORS errors

**Cause:** Frontend origin not in `SERVER_CONFIG.frontend.urls`

**Solution:** Add to `frontend.urls` in `server/config.js` or `FRONTEND_URL` env var

### Issue: PayPal integration fails

**Cause:** Missing or wrong PayPal configuration

**Solution:** 
```bash
# Check these environment variables:
echo $VITE_PAYPAL_CLIENT_ID
echo $VITE_PAYPAL_SECRET
echo $VITE_PAYPAL_MODE
```

---

## Summary

✅ **All hard-coded URLs eliminated**  
✅ **Single source of truth for configuration**  
✅ **Easy environment switching**  
✅ **Validation and debugging built-in**  
✅ **Follows PayPal fixes pattern**  

**Global configuration is now the standard for all environment-dependent values.**

---

**Last Updated:** December 14, 2025  
**Status:** Complete
