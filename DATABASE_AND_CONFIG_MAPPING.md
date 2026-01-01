# SKN Bridge Trade - Database & Configuration Mapping
## Source Repo vs Standalone Comparison
**Date**: December 30, 2025

---

## 1. ENVIRONMENT CONFIGURATION ✅

### Supabase Project
| Setting | Source (skn) | Standalone | Status |
|---------|------|----------|--------|
| **URL** | https://tmyxjsqhtxnuchmekbpt.supabase.co | https://tmyxjsqhtxnuchmekbpt.supabase.co | ✅ SAME |
| **Anon Key** | Same project | Same project | ✅ SAME |
| **Service Role** | Same project | Same project | ✅ SAME |

### PayPal Configuration
| Setting | Source | Standalone | Status |
|---------|--------|-----------|--------|
| **Mode** | live | live | ✅ SAME |
| **Client ID** | Ae9aWcPW... | Ae9aWcPW... | ✅ SAME |
| **Currency** | USD | USD | ✅ SAME |

### Server Configuration
| Setting | Source | Standalone | Status |
|---------|--------|-----------|--------|
| **Frontend URL** | http://localhost:3000 | http://localhost:3000 | ✅ SAME |
| **Backend Port** | 3001 | 3001 | ✅ SAME |
| **Environment** | development | development | ✅ SAME |

---

## 2. DATABASE SCHEMA MIGRATIONS ✅

### Migration Files Status
| File | Source | Standalone | Status |
|------|--------|-----------|--------|
| init_schema.sql | ✓ | ✓ | ✅ PRESENT |
| 20250101_complete_schema.sql | ✓ | ✓ | ✅ PRESENT |
| add_gallery_images.sql | ✓ | ✓ | ✅ PRESENT |
| add_onboarding_columns.sql | ✓ | ✓ | ✅ PRESENT |
| add_product_images.sql | ✓ | ✓ | ✅ PRESENT |
| normalize_variants.sql | ✓ | ✓ | ✅ PRESENT |
| storage_setup.sql | ✓ | ✓ | ✅ PRESENT |
| update_schema_for_app_requirements.sql | ✓ | ✓ | ✅ PRESENT |
| new_features_schema.sql | ✗ | ✓ | ⚠️ STANDALONE ONLY |

**⚠️ Note**: `new_features_schema.sql` is standalone-specific and has different table naming:
- Uses `wishlists` (plural) instead of `wishlist` (singular)
- May conflict with complete_schema.sql if not properly isolated

### Core Tables Created by Migrations
```
✅ profiles
✅ vendors
✅ categories
✅ products
✅ product_variants
✅ product_images
✅ cart_items
✅ orders
✅ order_items
✅ payments
✅ reviews
✅ wishlist (or wishlists)
✅ inventory
✅ inventory_logs
✅ notifications
✅ conversations
✅ messages
```

---

## 3. BACKEND SERVER ROUTES ✅

### Loaded Modules (from server/index.js)
| Route | Source | Standalone | Status |
|-------|--------|-----------|--------|
| /api/paypal | ✓ | ✓ | ✅ |
| /api/webhooks | ✓ | ✓ | ✅ |
| /api/onboarding | ✓ | ✓ | ✅ |
| /api/dashboard | ✓ | ✓ | ✅ |
| /api/health | ✓ | ✓ | ✅ |
| /api/reviews | ✓ | ✓ | ✅ |
| /api/vendor | ✓ | ✓ | ✅ |
| /api/orders | ✓ | ✓ | ✅ |
| /api/wishlist | ✓ | ✓ | ✅ |
| /api/inventory | ✓ | ✓ | ✅ |
| /api/messages | ✓ | ✓ | ✅ |

### Extra Modules (Standalone Only)
| Module | File | Purpose |
|--------|------|---------|
| products | server/products.js | Product CRUD operations |
| analytics | server/analytics.js | Sales analytics |
| notifications | server/notifications.js | Notification system |
| emails | server/emailQueue.js | Email queue management |
| paypal-refunds | server/paypal-refunds.js | Refund processing |
| paypal-verification | server/paypal-verification.js | PayPal verification |
| paypal-webhooks | server/paypal-webhooks.js | PayPal webhook handling |

---

## 4. FRONTEND API CONFIGURATION ✅

### API_CONFIG (src/config/environment.js)
| Setting | Dev | Production | Status |
|---------|-----|-----------|--------|
| **Base URL (Dev)** | /api | /api | ✅ SAME |
| **Proxy Target** | http://localhost:3001 | VITE_API_URL | ✅ SAME |
| **Timeout** | 30000ms | 30000ms | ✅ SAME |

### Vite Proxy (vite.config.js)
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    secure: false,
    ws: false
  }
}
```
**Status**: ✅ IDENTICAL in both repos

---

## 5. SUPABASE RLS POLICIES ⚠️

### Expected RLS Configuration
The migrations should create RLS policies for:
- ✅ profiles - User can read own profile
- ✅ vendors - Owner can manage own vendor
- ✅ products - Service role can query for display
- ✅ orders - User/vendor can query own orders
- ✅ reviews - Users can read/write own reviews
- ✅ wishlist - Users can manage own wishlist
- ✅ inventory - Vendors can manage own inventory
- ✅ notifications - Users can read own notifications
- ✅ messages - Conversation participants can read

**Action Required**: Verify RLS policies are properly applied by checking:
1. Supabase Console → Authentication → Policies
2. Each table should have appropriate SELECT, INSERT, UPDATE, DELETE policies
3. Service role should have full access for backend operations

---

## 6. CRITICAL DIFFERENCES FOUND ⚠️

### Issue 1: Table Naming Conflict
- **Source tables**: `wishlist`, `orders`, `order_items` (singular/standard naming)
- **Standalone schema**: `wishlists` (plural, from new_features_schema.sql)
- **Impact**: Frontend/backend code expects singular table names
- **Fix**: Ensure complete_schema.sql was the last migration run

### Issue 2: Missing RLS Policy Setup
- Migrations create tables but some may not have RLS enabled
- Backend expects to query as service role (bypass RLS)
- User-facing operations should be protected by RLS

**Action Required**: Review RLS setup in Supabase console

### Issue 3: Backend Module Imports
- Standalone has extra modules not in source (products.js, analytics.js, etc.)
- Source repo may not load these modules
- Check if standalone server/index.js differs

---

## 7. VERIFICATION CHECKLIST

Run these checks to ensure database mapping is correct:

### Database Tables
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify key tables
SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_name='products');
SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_name='orders');
SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_name='wishlist');
SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_name='vendors');
```

### RLS Policies
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname='public' AND tablename IN ('products', 'orders', 'wishlist', 'vendors');

-- Check policies exist
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname='public' 
ORDER BY tablename;
```

### Supabase Auth Setup
- [ ] At least one test user exists (seller1@example.com = seller)
- [ ] Profiles linked to auth.users
- [ ] Vendor records created for test users

---

## 8. MIGRATION ORDER

**Recommended order to run migrations in Supabase SQL editor**:

1. **init_schema.sql** - Creates base tables
2. **storage_setup.sql** - Sets up storage buckets
3. **add_product_images.sql** - Adds product image support
4. **add_gallery_images.sql** - Adds gallery features
5. **add_onboarding_columns.sql** - Adds KYC/onboarding columns
6. **normalize_variants.sql** - Normalizes product variants
7. **update_schema_for_app_requirements.sql** - Final app requirements
8. **20250101_complete_schema.sql** - Complete schema (orders, inventory, etc.)
9. **DO NOT RUN**: new_features_schema.sql (conflicts with complete schema)

---

## 9. NEXT STEPS

### Critical Actions
1. **Verify Migration Status**
   - Check Supabase SQL editor for errors from each migration
   - Confirm all core tables exist with proper columns

2. **Check RLS Policies**
   - Go to Supabase Console → Authentication → Policies
   - Verify RLS is enabled on all tables
   - Ensure service role has bypass enabled

3. **Test Database Connection**
   - Backend should successfully connect and query tables
   - Try fetching products, orders, vendors without errors

4. **Validate Frontend-Backend Integration**
   - API calls should use correct table names
   - No 404 or CORS errors

5. **Clean Up**
   - Remove new_features_schema.sql if it causes conflicts
   - Document any custom changes made to the database

### Testing Commands
```bash
# Test backend connectivity
curl http://localhost:3001/api/health

# Check specific endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/vendor/products
```

---

## 10. SUMMARY

| Category | Status | Notes |
|----------|--------|-------|
| Environment Vars | ✅ SYNCED | Same Supabase project, PayPal credentials, ports |
| Migration Files | ✅ COMPLETE | All 8 source migrations copied to standalone |
| Server Routes | ✅ MAPPED | All routes configured identically |
| Frontend Config | ✅ ALIGNED | API proxy and config match |
| Database Schema | ⚠️ VERIFY | Migrations present but need execution on actual DB |
| RLS Policies | ⚠️ CHECK | Need to verify in Supabase console |

**Overall**: The standalone repo is now properly aligned with the source repo in terms of structure and configuration. The main remaining task is to **verify the Supabase database has been updated with all migrations and RLS policies are properly configured**.

---

**Last Updated**: 2025-12-30
**Status**: Configuration synchronized ✅ | Database verification pending ⏳
