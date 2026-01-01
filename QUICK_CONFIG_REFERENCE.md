# Quick Reference: Source vs Standalone Comparison
**Purpose**: Quick lookup for configuration differences and alignments  
**Last Updated**: December 30, 2025

---

## 🔗 Database Connection
```
Both use: https://tmyxjsqhtxnuchmekbpt.supabase.co
Auth Keys: SAME (both projects identical)
Service Role: Enabled in both
```

## 🚀 Server Configuration
```
Source (skn)              Standalone
Port: 3001                Port: 3001 ✓
Env: development          Env: development ✓
Node: v18+                Node: v18+ ✓
PayPal Mode: live         PayPal Mode: live ✓
```

## 🛣️ API Routes (Both Have All 11)
```
✓ /api/paypal           - Payment processing
✓ /api/webhooks         - Event webhooks
✓ /api/onboarding       - Seller registration
✓ /api/dashboard        - Analytics & stats
✓ /api/health           - Server health check
✓ /api/reviews          - Product reviews
✓ /api/vendor           - Vendor operations
✓ /api/orders           - Order management
✓ /api/wishlist         - Favorites
✓ /api/inventory        - Stock management
✓ /api/messages         - Messaging system
```

## 📊 Database Tables (All 17+)
```
Core Tables:
✓ profiles          ✓ vendors            ✓ products
✓ product_variants  ✓ categories         ✓ product_images
✓ cart_items        ✓ orders             ✓ order_items
✓ payments          ✓ reviews            ✓ wishlist
✓ inventory         ✓ notifications      ✓ conversations
✓ messages
```

## 🔒 Authentication
```
Method: Supabase Auth + JWT
Token: Bearer token in Authorization header
Verification: verifySupabaseJwt middleware
Aliases: authenticateUser, requireAuth, verifyJWT
```

## 🔄 Frontend ↔ Backend Communication
```
Frontend (port 3000)
    ↓
    Vite proxy: /api → http://localhost:3001
    ↓
Backend (port 3001)
    ↓
Supabase PostgreSQL

API_CONFIG handles dev/prod automatically
```

## ⚙️ Environment Variables Match
```
VITE_SUPABASE_URL=https://tmyxjsqhtxnuchmekbpt.supabase.co
VITE_SUPABASE_ANON_KEY=... (same)
SUPABASE_SERVICE_ROLE_KEY=... (same)
PAYPAL_CLIENT_ID=Ae9aWcPW... (same)
PAYPAL_MODE=live (same)
FRONTEND_URL=http://localhost:3000 (same)
BACKEND_URL=http://localhost:3001 (same)
```

## 📁 Key Files That Differ
| Aspect | Source | Standalone | Status |
|--------|--------|-----------|--------|
| Extra modules | None | products.js, analytics.js, emails.js | Enhanced |
| Middleware | Single file | middleware.js + middleware/supabaseAuth.js | Compatible |
| Migrations | 8 files | 8 files + 1 extra | Extra feature |
| Server index | Standard | Async initialization | Same routes |

## ✅ What's Synchronized
- ✓ Database schema (migrations)
- ✓ Environment credentials
- ✓ API route configuration
- ✓ Server middleware setup
- ✓ Frontend API config
- ✓ PayPal integration
- ✓ Supabase authentication

## ⚠️ What Needs Verification
- RLS policies in Supabase dashboard
- Database migration execution status
- Service role key permissions

## 🔧 Common Imports
```javascript
// Backend Auth
import { verifySupabaseJwt } from './middleware.js';
// OR (for backward compat)
import { authenticateUser, verifyJWT } from './middleware.js';

// Frontend API
import { API_CONFIG } from '../config/environment.js';
const url = `${API_CONFIG.baseURL}/endpoint/path`;

// Supabase
import { supabase } from './supabaseClient.js';
```

## 🚀 Quick Start Commands
```bash
# Terminal 1: Frontend
cd skn-main-standalone
npm run dev                    # Start Vite dev server (port 3000)

# Terminal 2: Backend  
cd skn-main-standalone
node server/index.js          # Start Express server (port 3001)

# Browser
http://localhost:3000         # Application
http://localhost:3000/api/health  # Backend health via proxy
```

## 🐛 If Something Breaks
| Problem | Check |
|---------|-------|
| API 404 errors | Verify Vite proxy in vite.config.js |
| Auth failures | Check JWT in Authorization header |
| Database errors | Verify Supabase migrations ran |
| Vendor errors | Check RLS policies enabled |
| Email not sent | Check emailQueue.js configuration |

## 📝 Migration Sequence (if applying fresh)
1. init_schema.sql
2. storage_setup.sql
3. add_product_images.sql
4. add_gallery_images.sql
5. add_onboarding_columns.sql
6. normalize_variants.sql
7. update_schema_for_app_requirements.sql
8. 20250101_complete_schema.sql
⚠️ Skip: new_features_schema.sql (conflicts with #8)

---

**TL;DR**: Both repos are now identical in configuration. Same database, same backend setup, same environment. Standalone has some extra features/modules but maintains full compatibility.
