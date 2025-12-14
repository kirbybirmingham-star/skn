# Configuration Quick Reference

## Use These, NOT Hard-Coded Values

### Frontend (React Components)

```javascript
import { API_CONFIG, FRONTEND_CONFIG, FEATURE_FLAGS, PAYPAL_CONFIG } from '@/config/environment.js';

// Making API calls
fetch(`${API_CONFIG.baseURL}/api/endpoint`);

// Redirecting to internal pages
window.location.href = `${FRONTEND_CONFIG.url}/dashboard`;

// Checking features
if (FEATURE_FLAGS.enablePayPal) { /* ... */ }

// PayPal configuration
if (PAYPAL_CONFIG.clientId) { /* use PayPal */ }
```

### Backend (Node.js)

```javascript
import { SERVER_CONFIG, SUPABASE_CONFIG, PAYPAL_CONFIG } from './config.js';

// Server port
app.listen(SERVER_CONFIG.port);

// CORS origins
const allowedOrigins = SERVER_CONFIG.frontend.urls;

// URL construction
const url = `${SERVER_CONFIG.frontend.urls[0]}/api/endpoint`;

// Supabase
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);

// PayPal
const paypalClient = PAYPAL_CONFIG.clientId;
```

---

## Never Do This

```javascript
// ❌ DON'T
fetch('http://localhost:3001/api/endpoint');
app.listen(3001);
const origins = ['http://localhost:3000', 'http://localhost:3001'];
window.location = 'http://localhost:3000/dashboard';

// ✅ DO
fetch(`${API_CONFIG.baseURL}/api/endpoint`);
app.listen(SERVER_CONFIG.port);
const origins = SERVER_CONFIG.frontend.urls;
window.location = `${FRONTEND_CONFIG.url}/dashboard`;
```

---

## Environment Variables

### Frontend (.env or .env.local)
```
VITE_API_URL=http://localhost:3001
VITE_FRONTEND_URL=http://localhost:3000
VITE_PAYPAL_CLIENT_ID=your_client_id
VITE_PAYPAL_MODE=sandbox
VITE_DEBUG=false
```

### Backend (.env in root)
```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_PAYPAL_CLIENT_ID=your_client_id
VITE_PAYPAL_SECRET=your_secret
DEBUG_CONFIG=false
```

---

## Common Usage Patterns

### Making an API Request
```javascript
import { API_CONFIG } from '@/config/environment.js';

const response = await fetch(`${API_CONFIG.baseURL}/api/onboarding/me`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Constructing Internal URL
```javascript
import { FRONTEND_CONFIG } from '@/config/environment.js';

const dashboardUrl = `${FRONTEND_CONFIG.url}/dashboard/vendor`;
```

### Conditional Feature
```javascript
import { FEATURE_FLAGS } from '@/config/environment.js';

if (FEATURE_FLAGS.enablePayPal) {
  // Show PayPal button
}
```

### Server: Check CORS
```javascript
import { SERVER_CONFIG } from './config.js';

if (SERVER_CONFIG.frontend.urls.includes(origin)) {
  // Allow request
}
```

### Server: URL in Response
```javascript
import { SERVER_CONFIG } from './config.js';

const frontendUrl = SERVER_CONFIG.frontend.urls[0];
const resetLink = `${frontendUrl}/reset-password?token=${token}`;
```

---

## Testing Different Environments

### Local Development
```bash
VITE_API_URL=http://localhost:3001 npm run dev
```

### Staging
```bash
VITE_API_URL=https://staging-api.onrender.com npm run dev
```

### Production Preview
```bash
VITE_API_URL=https://api.skn.com npm run build && npm run preview
```

---

## Debugging Configuration

### Check Frontend Config
```javascript
// In browser console
import { API_CONFIG, FEATURE_FLAGS } from '@/config/environment.js';
console.log('API Base URL:', API_CONFIG.baseURL);
console.log('Features:', FEATURE_FLAGS);
```

### Check Backend Config
```bash
# Start with debug
DEBUG_CONFIG=true npm start
```

---

## Adding New Configuration

1. **Decide: Frontend or Backend?**
   - Frontend: `src/config/environment.js`
   - Backend: `server/config.js`

2. **Add the value:**
   ```javascript
   export const MY_CONFIG = {
     value: process.env.MY_VALUE || 'default'
   };
   ```

3. **Add to .env:**
   ```
   MY_VALUE=actual_value
   ```

4. **Use it:**
   ```javascript
   import { MY_CONFIG } from './config.js';
   console.log(MY_CONFIG.value);
   ```

5. **Document it** in `GLOBAL_CONFIGURATION_GUIDE.md`

---

## Key Files

| File | Purpose | Import |
|------|---------|--------|
| `src/config/environment.js` | Frontend config | `import { API_CONFIG } from '@/config/environment.js'` |
| `server/config.js` | Backend config | `import { SERVER_CONFIG } from './config.js'` |
| `.env` | Environment variables | Set before running |
| `GLOBAL_CONFIGURATION_GUIDE.md` | Detailed documentation | Read for reference |

---

## Quick Checklist

- [ ] Never use `'http://localhost:3001'` - use `API_CONFIG.baseURL`
- [ ] Never use `'http://localhost:3000'` - use `FRONTEND_CONFIG.url`
- [ ] Never hard-code port numbers - use `SERVER_CONFIG.port`
- [ ] Never hard-code CORS origins - use `SERVER_CONFIG.frontend.urls`
- [ ] Validate config on startup
- [ ] Document new variables in guide
- [ ] Test with different .env files

---

**This is the global standard. Follow it.**
