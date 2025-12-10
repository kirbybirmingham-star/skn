# ✅ Deployment Verification Checklist

## Pre-Deployment Tests

### Database Configuration
- [x] Products table accessible to anonymous users
- [x] Product variants queryable without errors
- [x] Vendors table accessible to anonymous users  
- [x] Profiles table accessible to anonymous users
- [x] RLS policies applied to all public tables
- [x] No 404 errors on REST API endpoints

### API Functionality
- [x] `getProductById()` returns product successfully
- [x] `getProducts()` returns product list
- [x] `getVendors()` returns vendor list
- [x] Variant fallback logic working
- [x] Ratings gracefully skipped if table inaccessible
- [x] No console errors related to queries

### Frontend Pages
- [x] `/` Home page loads
- [x] `/marketplace` Product listings display
- [x] `/product/[id]` Product details page loads
- [x] `/store` Vendor cards display
- [x] `/store/[id]` Individual store page loads
- [x] Product images load correctly
- [x] Add to cart functionality works

### Error Handling
- [x] No unhandled 404 errors
- [x] No unhandled RLS errors
- [x] Graceful fallbacks for missing data
- [x] User-friendly error messages
- [x] Console logging for debugging

---

## Post-Deployment Monitoring

### Logs to Watch For
- ❌ `column [x] does not exist`
- ❌ `Could not find a relationship`
- ❌ `404 (Not Found)` on REST API
- ❌ `RLS policy missing`

### Metrics to Monitor
- Response times for product queries
- Number of failed RLS checks
- User errors reported for data loading
- Page load times for listings

### Performance Baselines
- Product details page: < 1 second
- Vendor listing: < 1 second
- Product listing: < 1 second

---

## If Issues Arise

### Product Details Page Returns "Not Found"
1. Run: `node scripts/test-product-access.js`
2. If fails: Apply RLS policy from `TROUBLESHOOTING_GUIDE.md` Issue 1
3. Reload browser
4. Verify: `node scripts/fetch-product-by-id.js [id]`

### Vendor Cards Don't Show
1. Run the vendor test scripts:
  - `node scripts/test-get-vendors.js` — ensures `getVendors()` returns vendor rows and avatars
  - `node scripts/test-vendor-display.js` — confirms vendor cards are ready for display with featured products
2. Check column names and RLS:
  - `node scripts/inspect-db.js` — validate `vendors` has `name` and `profiles` has `avatar_url`
  - If RLS is blocking, apply the SQL from `TROUBLESHOOTING_GUIDE.md` (Issue 2) to allow public read
3. If the API is querying wrong column names or relationships:
  - Update `src/api/EcommerceApi.jsx` — use `name` (not `business_name`) and separate profile fetch by `owner_id` (avoid nested `profile:profiles` selects)
4. Restart / rebuild your dev server:
  - If dev server fails due to a port conflict, kill the process using the port or run dev with a different port: `npm run dev -- --port 5173`
5. Reload browser and test: Confirm the /store page displays vendor cards and no 400 errors related to `business_name` or `profile:profiles`.

### Variant Projection Errors
1. Check logs: Look for `[variantSelectHelper]` messages
2. The system should automatically fallback - monitor if fallback is being triggered
3. If failing completely: Update `src/lib/variantSelectHelper.js` with new column names

### Ratings Causing Issues
1. These should be gracefully handled
2. If errors appear: Run `node scripts/check-ratings-relation.js`
3. If table missing: Either create it (see guide) or ignore (app works without)

---

## Quick Recovery Script

If you need to quickly verify/restore all fixes:

```bash
#!/bin/bash

echo "🔍 Verifying all fixes..."
echo ""

echo "1️⃣  Testing product access..."
node scripts/test-product-access.js
echo ""

echo "2️⃣  Testing vendor access..."
node -e "
import('dotenv/config').then(() => {
  import('@supabase/supabase-js').then(({ createClient }) => {
    const c = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    (async () => {
      const { data } = await c.from('vendors').select('id').limit(1);
      console.log('Vendors:', data?.length > 0 ? '✅ OK' : '❌ FAIL');
    })();
  });
});
"
echo ""

echo "3️⃣  Checking schema..."
node scripts/inspect-db.js | grep -E "^Total|^-"
echo ""

echo "✅ Verification complete"
```

---

## Documentation Files Created

| File | Purpose |
|------|---------|
| `TROUBLESHOOTING_GUIDE.md` | Comprehensive guide for all issues |
| `RLS_QUICK_REFERENCE.md` | Quick lookup for RLS policies |
| `FIXES_SUMMARY_DEC_9.md` | Summary of fixes applied |
| `DEPLOYMENT_CHECKLIST.md` | This file - pre/post deployment |

---

## Communication Template

If you need to report fixes to team:

> **Issue Resolved:** Product Details Page & Vendor Cards Not Loading
> 
> **Root Cause:** RLS (Row Level Security) policies preventing anonymous user access to database tables
> 
> **Changes Made:**
> 1. Applied RLS policies to products, variants, ratings, vendors, and profiles tables
> 2. Fixed column name mismatches in vendor queries (business_name → name)
> 3. Enhanced API resilience with fallback logic
> 4. Created comprehensive troubleshooting guide
> 
> **Testing:** All pages verified working correctly. Full test suite available in scripts/
> 
> **Status:** ✅ Production Ready

---

## Sign-Off

- **Date:** December 9, 2025
- **Fixed By:** Copilot
- **All Tests:** ✅ PASSED
- **Documentation:** ✅ COMPLETE
- **Ready for Deployment:** ✅ YES

---

For any issues, reference:
- **Quick fixes:** `RLS_QUICK_REFERENCE.md`
- **Detailed steps:** `TROUBLESHOOTING_GUIDE.md`
- **What was fixed:** `FIXES_SUMMARY_DEC_9.md`
