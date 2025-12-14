# Global Configuration Standard - Development Guidelines

**Effective Date:** December 14, 2025  
**Status:** Active Standard for All New Development

---

## The Rule

🚫 **Never hard-code environment-dependent values**

✅ **Always use the global configuration system**

---

## What This Means

### Hard-Coded Values (❌ DON'T)

```javascript
// URLs
const apiUrl = 'http://localhost:3001';
const frontendUrl = 'http://localhost:3000';
fetch('https://api.example.com/endpoint');

// Ports
app.listen(3001);
const port = 3001;

// Origins
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];

// Keys
const clientId = 'actual_paypal_id';
const apiKey = 'actual_api_key';

// Environment checks
if (process.env.NODE_ENV === 'development') { ... }
```

### Using Configuration (✅ DO)

```javascript
// Frontend
import { API_CONFIG, FRONTEND_CONFIG } from '@/config/environment.js';
fetch(`${API_CONFIG.baseURL}/endpoint`);
window.location = `${FRONTEND_CONFIG.url}/dashboard`;

// Backend
import { SERVER_CONFIG, PAYPAL_CONFIG } from './config.js';
app.listen(SERVER_CONFIG.port);
const allowedOrigins = SERVER_CONFIG.frontend.urls;
const clientId = PAYPAL_CONFIG.clientId;

// Environment checks
if (SERVER_CONFIG.environment === 'development') { ... }
```

---

## What Counts as "Environment-Dependent"

### Definitely Environment-Dependent
- ✅ URLs (backend, frontend, API endpoints)
- ✅ Port numbers
- ✅ CORS origins
- ✅ API keys and credentials
- ✅ Database connections
- ✅ Feature flags
- ✅ Timeouts and limits
- ✅ Environment-specific paths

### NOT Environment-Dependent
- ❌ Business logic
- ❌ Algorithm implementations
- ❌ UI copy and text
- ❌ Color codes and styling
- ❌ Format strings
- ❌ Regular expressions
- ❌ Math constants

---

## Configuration System Locations

### Frontend
**File:** `src/config/environment.js`

```javascript
import { API_CONFIG, FRONTEND_CONFIG, FEATURE_FLAGS, PAYPAL_CONFIG } from '@/config/environment.js';
```

### Backend
**File:** `server/config.js`

```javascript
import { SERVER_CONFIG, SUPABASE_CONFIG, PAYPAL_CONFIG } from './config.js';
```

---

## Common Patterns

### Pattern 1: API Calls
```javascript
// Frontend
import { API_CONFIG } from '@/config/environment.js';

const response = await fetch(`${API_CONFIG.baseURL}/endpoint`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Pattern 2: Internal Redirects
```javascript
// Frontend
import { FRONTEND_CONFIG } from '@/config/environment.js';

window.location = `${FRONTEND_CONFIG.url}/dashboard/vendor`;
```

### Pattern 3: Feature Flags
```javascript
// Frontend
import { FEATURE_FLAGS } from '@/config/environment.js';

if (FEATURE_FLAGS.enablePayPal) {
  // Show PayPal button
}
```

### Pattern 4: Server Configuration
```javascript
// Backend
import { SERVER_CONFIG } from './config.js';

app.listen(SERVER_CONFIG.port, () => {
  console.log(`Server running on port ${SERVER_CONFIG.port}`);
});
```

### Pattern 5: CORS Setup
```javascript
// Backend
import { SERVER_CONFIG } from './config.js';

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

### Pattern 6: URL Construction
```javascript
// Backend
import { SERVER_CONFIG } from './config.js';

const frontendUrl = SERVER_CONFIG.frontend.urls[0];
const resetLink = `${frontendUrl}/reset?token=${token}`;
```

---

## Adding New Configuration

### Step 1: Determine Category
Is this for:
- Frontend? → `src/config/environment.js`
- Backend? → `server/config.js`

### Step 2: Add to Configuration File

**Frontend Example:**
```javascript
// src/config/environment.js
export const MY_FEATURE_CONFIG = {
  apiEndpoint: import.meta.env.VITE_MY_ENDPOINT || '/api/my-endpoint',
  timeout: parseInt(import.meta.env.VITE_MY_TIMEOUT || '5000'),
  retryCount: parseInt(import.meta.env.VITE_MY_RETRIES || '3')
};
```

**Backend Example:**
```javascript
// server/config.js
export const MY_FEATURE_CONFIG = {
  apiEndpoint: process.env.MY_ENDPOINT || '/api/my-endpoint',
  timeout: parseInt(process.env.MY_TIMEOUT || '5000'),
  retryCount: parseInt(process.env.MY_RETRIES || '3')
};
```

### Step 3: Add to `.env`
```
VITE_MY_ENDPOINT=/api/my-endpoint
VITE_MY_TIMEOUT=5000
VITE_MY_RETRIES=3

# Backend
MY_ENDPOINT=/api/my-endpoint
MY_TIMEOUT=5000
MY_RETRIES=3
```

### Step 4: Use in Code
```javascript
import { MY_FEATURE_CONFIG } from '@/config/environment.js'; // or './config.js'

const endpoint = MY_FEATURE_CONFIG.apiEndpoint;
const timeout = MY_FEATURE_CONFIG.timeout;
```

### Step 5: Document
Update:
- `GLOBAL_CONFIGURATION_GUIDE.md` - Add detailed documentation
- `CONFIGURATION_QUICK_REFERENCE.md` - Add to quick reference
- Add comments in the configuration file

---

## Environment-Specific Examples

### Development (.env)
```
# Frontend
VITE_API_URL=http://localhost:3001
VITE_FRONTEND_URL=http://localhost:3000
VITE_DEBUG=true

# Backend
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DEBUG_CONFIG=true
```

### Staging
```
# Frontend
VITE_API_URL=https://staging-api.onrender.com
VITE_FRONTEND_URL=https://staging.onrender.com
VITE_DEBUG=false

# Backend
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://staging.onrender.com
VITE_API_URL=https://staging-api.onrender.com
```

### Production
```
# Frontend
VITE_API_URL=https://api.skn.com
VITE_FRONTEND_URL=https://skn.com
VITE_DEBUG=false

# Backend
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://skn.com
VITE_API_URL=https://api.skn.com
```

---

## Validation Pattern

### Frontend
```javascript
import { validateConfig } from '@/config/environment.js';

// At application startup
validateConfig();
```

### Backend
```javascript
import { validateServerConfig } from './config.js';

// At server startup
validateServerConfig();
```

---

## Import Statements

### Frontend
```javascript
// Single import
import { API_CONFIG } from '@/config/environment.js';

// Multiple imports
import { API_CONFIG, FRONTEND_CONFIG, FEATURE_FLAGS } from '@/config/environment.js';

// Namespace import
import * as Config from '@/config/environment.js';
const url = Config.API_CONFIG.baseURL;
```

### Backend
```javascript
// Single import
import { SERVER_CONFIG } from './config.js';

// Multiple imports
import { SERVER_CONFIG, PAYPAL_CONFIG, SUPABASE_CONFIG } from './config.js';

// Namespace import
import * as Config from './config.js';
const port = Config.SERVER_CONFIG.port;
```

---

## Debugging

### Frontend Debug Mode
```bash
VITE_DEBUG=true npm run dev
```

Outputs to browser console:
```
App Configuration: {
  api: { baseURL: 'http://localhost:3001', ... },
  frontend: { url: 'http://localhost:3000', ... },
  features: { enablePayPal: true, ... }
}
```

### Backend Debug Mode
```bash
DEBUG_CONFIG=true npm start
```

Outputs to terminal:
```
Server Configuration: {
  port: 3001,
  environment: 'development',
  frontendUrls: [...],
  ...
}
```

---

## Checking Configuration

### Frontend Console Check
```javascript
// In browser DevTools console
import { API_CONFIG } from '@/config/environment.js';
console.log(API_CONFIG);
```

### Backend Runtime Check
```bash
# Start server and look for configuration output
npm start | grep "Configuration\|Server\|Port"
```

---

## Troubleshooting

### Issue: 404 on API Call
**Check:**
```javascript
console.log('API Base URL:', API_CONFIG.baseURL);
// Should match your backend URL
```

### Issue: CORS Error
**Check:**
- Frontend URL in `SERVER_CONFIG.frontend.urls`
- OR `FRONTEND_URL` environment variable
- OR `VITE_FRONTEND_URL` environment variable

### Issue: Wrong Environment
**Check:**
```javascript
// Frontend
console.log(FRONTEND_CONFIG.env);

// Backend
console.log(SERVER_CONFIG.environment);
```

---

## Review Checklist

When reviewing code, check:

- [ ] No hard-coded URLs (localhost or otherwise)
- [ ] No hard-coded port numbers
- [ ] No hard-coded CORS origins
- [ ] No hard-coded API keys
- [ ] All environment values use configuration system
- [ ] Configuration objects imported correctly
- [ ] Environment variables documented
- [ ] Validation called at startup
- [ ] Sensible defaults provided
- [ ] DEBUG output available for troubleshooting

---

## One More Thing

**This is not optional.**

Every developer working on this codebase must follow this standard. It ensures:
- 🔒 Production safety (no localhost in production)
- 🔄 Easy deployments (just change .env)
- 🧪 Easy testing (different .env for each environment)
- 🤝 Team consistency (everyone follows same pattern)
- 📝 Code clarity (clear where values come from)
- ⚠️ Fewer bugs (validation catches missing config)

---

## Questions?

See:
1. `CONFIGURATION_QUICK_REFERENCE.md` - Quick answers
2. `GLOBAL_CONFIGURATION_GUIDE.md` - Detailed reference
3. `src/config/environment.js` - Frontend config examples
4. `server/config.js` - Backend config examples

---

**This standard is effective immediately.**

**All new code must follow this pattern.**

**All existing code should be migrated to this pattern.**

---

Date: December 14, 2025  
Status: Active ✅
