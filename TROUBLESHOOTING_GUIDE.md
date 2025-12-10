# SKN Bridge Trade - Troubleshooting & Fix Guide

## Overview
This guide documents common issues encountered during development and deployment, along with their solutions.

---

## Issue 1: Product Details Page Shows "Product Not Found"

### Symptoms
- Navigate to `/product/[product-id]` 
- Page displays "Product Not Found" error
- Database has products but they aren't loading

### Root Cause
**RLS (Row Level Security) Policy Blocking Anonymous Access**

The `products` table has RLS enabled with policies that prevent anonymous/unauthenticated users from reading product data. Service role keys can bypass RLS, but frontend users (anonymous) cannot.

### Diagnosis
Run this test to verify:

```bash
node scripts/test-product-access.js
```

If you see:
- Anonymous: 0 products
- Service Role: N products

Then RLS is blocking access.

### Solution

Go to **Supabase SQL Editor** and run:

```sql
-- Allow public to read products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read" ON products;
CREATE POLICY "Allow public read" ON products
  FOR SELECT
  USING (true);

-- Allow public to read product variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read variants" ON product_variants;
CREATE POLICY "Allow public read variants" ON product_variants
  FOR SELECT
  USING (true);

-- Allow public to read product ratings
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read ratings" ON product_ratings;
CREATE POLICY "Allow public read ratings" ON product_ratings
  FOR SELECT
  USING (true);
```

**Verification:** Navigate to a product and it should load successfully.

---

## Issue 2: Vendor Cards Not Showing on Store Page (RESOLVED)

### Symptoms
- Visit `/store` page (vendor listing)
- Shows "No stores found" message
- Database has vendors but they don't appear

### Root Cause
**Two Problems:**

1. **RLS Policy Missing** - `vendors` and `profiles` tables block anonymous read access
2. **Column Name Mismatch** - API queries `business_name` but table column is `name`

### Diagnosis

Check database schema:
```bash
node -e "
import('dotenv/config').then(() => {
  import('@supabase/supabase-js').then(({ createClient }) => {
    const serviceClient = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    (async () => {
      const { data } = await serviceClient.from('vendors').select('*').limit(1);
      if (data?.length) console.log('Vendor columns:', Object.keys(data[0]));
    })();
  });
});
"
```

Expected output should show `name` (not `business_name`) in the columns.

### Solution

**Part A: Fix API Queries**

The API code has been updated to use correct column names:
- Changed `business_name` → `name` and `store_name`
- Updated order clause to use `name` instead of `business_name`

Location: `src/api/EcommerceApi.jsx` (lines 305-380)

**Part B: Add RLS Policies**

Go to **Supabase SQL Editor** and run:

```sql
-- Allow public to read vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read" ON vendors;
CREATE POLICY "Allow public read" ON vendors
  FOR SELECT
  USING (true);

-- Allow public to read profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read profiles" ON profiles;
CREATE POLICY "Allow public read profiles" ON profiles
  FOR SELECT
  USING (true);
```

**Status:** ✅ RESOLVED

**Fix Summary:**
- Updated API: `src/api/EcommerceApi.jsx` — replaced `business_name` → `name`, and removed nested `profile:profiles` select. `getVendors()` now fetches vendors, then separately fetches `profiles` by `owner_id` for avatars and products per vendor in a second step.
- UI: `src/components/VendorCard.jsx` — added avatar fallback (initial-letter) and logging to avoid broken images.
- DB: RLS policies applied for `vendors` and `profiles` tables.

**Verification (how to verify the fix):**
1. Run tests locally:
  - `node scripts/test-get-vendors.js` — ensures `getVendors()` returns expected vendor objects and avatars
  - `node scripts/test-vendor-display.js` — verifies vendor cards are ready to display and have featured products
2. Start or restart the dev server and confirm UI:
  - If dev server cannot start due to port conflict, either kill the running process or change port:
    - Windows PowerShell: `tasklist | findstr node` and `taskkill /PID <PID> /F`, or `npm run dev -- --port 5173`
  - Visit: `http://localhost:5173/store` (default is 5173 for Vite, or your configured port)
3. Check browser console logs for:
  - `[getVendors] Starting...`, `[getVendors] Got 7 vendors`, and `VendorCard` logs (indicates render)
  - No 400 Bad Request referencing `business_name` or `profile:profiles` relationship errors
4. Confirm vendor cards display and avatars show (or fallback initials appear when avatar is missing)
5. If vendor cards still don't appear after these checks, run `node scripts/inspect-db.js` to confirm `vendors` and `profiles` columns exist and RLS is set, and verify `getVendors()` function is the version in `src/api/EcommerceApi.jsx` and not stale in a pre-built bundle

---

## Issue 3: 404 Error on `product_ratings` REST API Endpoint

### Symptoms
Browser console shows:
```
GET https://[project].supabase.co/rest/v1/product_ratings?select=id&limit=1 404 (Not Found)
```

### Root Cause
**RLS Policy Missing** on `product_ratings` table, and/or the ratings existence checker is making queries before RLS is configured.

### Solution

Already covered in **Issue 1** above. Run the RLS policy SQL for `product_ratings` table.

**Additional:** The code has been updated with resilient error handling:

- `src/lib/ratingsChecker.js` - Now treats all errors (404, permission denied, etc.) as "table not accessible"
- `src/lib/variantSelectHelper.js` - Added extensive logging and multiple fallback attempts
- Queries gracefully skip `product_ratings` if the table isn't accessible

**Verification:** Check browser console - no 404 errors should appear.

---

## Issue 4: Variant Projection Failures

### Symptoms
Browser/server logs show errors like:
```
column product_variants_1.name does not exist (Code: 42703)
```

### Root Cause
API tries to query specific columns on `product_variants` that don't exist in your schema, or the relation structure differs from expected.

### Solution

The code has been updated with **resilient variant selection**:

1. **Helper Function:** `src/lib/variantSelectHelper.js`
   - Tries multiple variant projection shapes
   - Falls back gracefully when columns don't exist
   - Logs which projection succeeded for debugging

2. **Fallback Chain:**
   - Try: `product_variants(id, name, images)` with ratings
   - Try: `product_variants(id, title, images)` with ratings
   - Try: `product_variants(*)` with ratings
   - Try: Same three without ratings
   - Final: Basic product select without variants

3. **Usage in API:**
   - `EcommerceApi.jsx` and `EcommerceApi.js` use `selectProductWithVariants()` helper
   - Automatically handles schema differences

**Verification:** Run test script:

```bash
node scripts/fetch-product-by-id.js [product-id]
```

Should return product with variants array (even if empty).

---

## Issue 5: Product Ratings Table Missing or Inaccessible

### Symptoms
- Frontend queries work without ratings
- Rating count/display missing on product cards
- No errors thrown (gracefully handled)

### Root Cause
- `product_ratings` table doesn't exist, OR
- RLS policies prevent access, OR
- The relation is not set up correctly

### Solution

**Option A: Create the Table**

If you want ratings functionality, run this SQL:

```sql
CREATE TABLE IF NOT EXISTS product_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add RLS
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Allow public read ratings"
  ON product_ratings
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow users to insert ratings"
  ON product_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to read own ratings
CREATE POLICY "Allow users to read own ratings"
  ON product_ratings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR product_id IN (
    SELECT id FROM products WHERE is_published = true
  ));

-- Create index for performance
CREATE INDEX idx_product_ratings_product_id ON product_ratings(product_id);
CREATE INDEX idx_product_ratings_user_id ON product_ratings(user_id);
```

**Option B: Ignore Ratings (Current Behavior)**

The app is designed to work without ratings. The code:
- Checks if table exists before querying
- Gracefully skips ratings if not available
- No errors thrown to users

**Verification:** Run:

```bash
node scripts/check-ratings-relation.js
```

---

## Issue 6: Column Name Mismatches Across Tables

### Symptoms
Errors like:
```
column "[table].[column]" does not exist
```

### Common Mismatches Found

| Table | API Expected | Actual Column | Status |
|-------|--------------|---------------|--------|
| vendors | business_name | name | ✅ Fixed |
| vendors | - | store_name | ✅ Added to query |
| product_variants | name | (varies) | ✅ Handled with fallback |
| product_variants | title | (varies) | ✅ Handled with fallback |

### Solution

1. **Always inspect schema first:**

```bash
node -e "
import('dotenv/config').then(() => {
  import('@supabase/supabase-js').then(({ createClient }) => {
    const sc = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    (async () => {
      const { data } = await sc.from('[TABLE_NAME]').select('*').limit(1);
      if (data?.length) console.log(Object.keys(data[0]));
    })();
  });
});
"
```

2. **Update API queries** to match actual columns

3. **Use fallback logic** when columns vary (like product_variants)

---

## Quick Test Suite

### Test All Fixes

```bash
# Test product access
node scripts/test-product-access.js

# Test vendor access
node -e "
import('dotenv/config').then(() => {
  import('@supabase/supabase-js').then(({ createClient }) => {
    const anonClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    (async () => {
      const { data, error } = await anonClient.from('vendors').select('id, name').limit(1);
      console.log('Vendors accessible:', !error && data?.length > 0);
      if (error) console.log('Error:', error.message);
    })();
  });
});
"

# Test specific product fetch
node scripts/fetch-product-by-id.js [PRODUCT_ID]

# Test ratings table
node scripts/check-ratings-relation.js

# Test variant mapping
node scripts/test-variant-mapping.js
```

---

## Preventive Best Practices

### 1. Always Enable RLS with Public Read Policy

When creating new tables:

```sql
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read"
  ON [table_name]
  FOR SELECT
  USING (true);
```

### 2. Validate Schema Before Queries

Inspect actual column names before writing queries.

### 3. Use Fallback Logic for Relations

When relations might vary:
- Try specific column projections first
- Fall back to wildcard `(*)`
- Finally fall back to no relation

### 4. Log Queries in Development

The codebase includes debug logging. Enable in browser console:

```javascript
localStorage.debug = '*'
```

Check logs:
- `[variantSelectHelper]` - Which projection succeeded
- `[getProductById]` - Which query method was used
- `[ratingsChecker]` - Whether ratings table is accessible

### 5. Test RLS Changes Immediately

After adding RLS policies:

```bash
# Verify with anon key
node scripts/test-product-access.js

# Reload browser
```

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `column [x] does not exist` | Schema mismatch | Use `fallback` logic or update query |
| `404 (Not Found)` on REST API | RLS blocking access | Add public read policy |
| `Could not find relationship` | Relation missing | Update schema or skip relation in query |
| `No data returned` | RLS denying access | Check RLS policies |
| `Column product_variants_1.name does not exist` | Variant schema varies | Already handled by fallback logic |

---

## Development Workflow

1. **Create/modify table** → Run inspection script
2. **Add/update RLS policies** → Test with anon key
3. **Write API queries** → Use fallback patterns
4. **Test frontend** → Check browser console logs
5. **Verify** → Run test scripts

---

## Useful Scripts

| Script | Purpose |
|--------|---------|
| `scripts/inspect-db.js` | Show all tables and sample data |
| `scripts/test-product-access.js` | Test RLS on products |
| `scripts/fetch-product-by-id.js [id]` | Fetch single product |
| `scripts/check-ratings-relation.js` | Check ratings tables |
| `scripts/test-variant-mapping.js` | Test variant queries |
| `scripts/test-products-fallback.js` | Test product listings |

---

## Reference: Fixed Files

### Code Changes Made

1. **`src/lib/variantSelectHelper.js`**
   - Added extensive logging
   - Multiple fallback attempts
   - Graceful error handling

2. **`src/lib/ratingsChecker.js`**
   - Enhanced to treat all errors as "table not accessible"
   - Caches results to avoid repeated queries

3. **`src/api/EcommerceApi.jsx`**
   - Fixed column names (business_name → name, store_name)
   - Uses variantSelectHelper for resilient queries
   - Checks ratings existence before including in queries

4. **`src/pages/ProductDetailsPage.jsx`**
   - Uses updated API functions
   - Proper error logging

5. **`src/pages/StorePage.jsx`**
   - Uses updated getVendors() function
   - Displays vendor cards correctly

### SQL Changes Made

All in **Supabase SQL Editor**:

```sql
-- Products table RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON products FOR SELECT USING (true);

-- Product variants RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read variants" ON product_variants FOR SELECT USING (true);

-- Product ratings RLS
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read ratings" ON product_ratings FOR SELECT USING (true);

-- Vendors RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON vendors FOR SELECT USING (true);

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read profiles" ON profiles FOR SELECT USING (true);
```

---

## Next Steps

- [ ] Verify all pages load correctly
- [ ] Test on deployed environment
- [ ] Monitor logs for any remaining issues
- [ ] Consider adding authenticated write policies if needed
- [ ] Document any environment-specific configurations

---

**Last Updated:** December 9, 2025  
**Status:** Active - All major issues resolved
