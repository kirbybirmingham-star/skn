# RLS Security Setup Guide

## Overview

This guide walks you through enabling Row-Level Security (RLS) on all database tables and applying security policies.

**Status:** ⚠️ **SECURITY CRITICAL** - RLS is currently disabled on all tables

---

## Step 1: Run Initial Test

Before making changes, verify current state:

```bash
node test-database-schema.js
```

Expected output: All tables exist but RLS is disabled.

---

## Step 2: Enable RLS and Apply Policies

### Via Supabase Dashboard (Easy - Recommended for Development)

1. Go to https://app.supabase.com
2. Select your project (skn)
3. Navigate to **SQL Editor**
4. Create a new query
5. Copy and paste the contents of: `supabase_migrations/enable-rls-all-tables.sql`
6. Click **Run** (or Ctrl+Enter)
7. Wait for completion

### Via Supabase CLI (Recommended for Production)

```bash
# If you have Supabase CLI installed
supabase db push

# Or run migrations directly
supabase db execute --file supabase_migrations/enable-rls-all-tables.sql
```

### Via Node.js Script (Alternative)

```bash
# Create and run via JavaScript
node scripts/apply-rls-policies.js
```

---

## Step 3: Populate Product Variants

### Via Supabase Dashboard

1. **SQL Editor** → **New Query**
2. Copy contents of: `supabase_migrations/populate-product-variants.sql`
3. Click **Run**

**Important:** This creates a default variant for each product using the base price.

### Verify Population

```bash
# Check that variants were created
SELECT 
  COUNT(DISTINCT product_id) as products_with_variants,
  COUNT(*) as total_variants
FROM product_variants;
```

Expected: Should match number of products in your database.

---

## Step 4: Test RLS Access Control

Run the comprehensive RLS test:

```bash
node test-rls-access-control.js
```

### Expected Output

**For Public Tables (should ALLOW):**
- ✓ products - ALLOWED
- ✓ product_variants - ALLOWED  
- ✓ reviews - ALLOWED

**For Private Tables (should BLOCK):**
- ✓ orders - BLOCKED (RLS by user_id)
- ✓ order_items - BLOCKED (RLS by order)
- ✓ profiles - BLOCKED (RLS by self + admin)
- ✓ payouts - BLOCKED (RLS by vendor_id)

**Service Role Access:**
- ✓ All tables - ALLOWED (backend can access everything)

---

## Step 5: Verify Policies in Supabase

Go to **SQL Editor** and run:

```sql
-- Check RLS enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: all should show rowsecurity = true
```

```sql
-- List all policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: 15+ policies across all tables
```

---

## Security Policies Explained

### Products
- **SELECT:** Public can read (browse catalog)
- **INSERT/UPDATE/DELETE:** Service role + admins only

### Product Variants
- **SELECT:** Public can read (see pricing/options)
- **INSERT/UPDATE/DELETE:** Service role + admins only

### Profiles
- **SELECT:** Users read own profile + admins read all
- **UPDATE:** Users update own profile only
- **INSERT/DELETE:** Service role only

### Orders
- **SELECT:** Users read own orders + admins read all
- **INSERT/UPDATE/DELETE:** Service role (backend) only

### Order Items
- **SELECT:** Users read items from their orders + admins read all
- **INSERT/UPDATE/DELETE:** Service role (backend) only

### Payouts
- **SELECT:** Vendors read own payouts + admins read all
- **INSERT/UPDATE/DELETE:** Service role (backend) only

### Reviews
- **SELECT:** Public can read (see product reviews)
- **INSERT:** Authenticated users create own
- **UPDATE:** Users update own reviews
- **DELETE:** Admins only

---

## Testing Payment Flow with RLS Enabled

Once RLS is active:

```bash
# 1. Start development server
npm run dev

# 2. In another terminal, test the flow
node test-cart-payment-flow.js

# 3. Manually test in browser:
#    - Visit http://localhost:3000
#    - Add product to cart
#    - Open cart
#    - Click "Checkout with PayPal"
#    - Approve payment (test mode)
#    - Verify success page
```

---

## Troubleshooting

### Problem: "RLS blocked" errors in frontend

**Solution:** Make sure your API calls are authenticated:

```javascript
// Backend calls should use service_role key
const client = createClient(url, SUPABASE_SERVICE_ROLE_KEY);

// Frontend calls should use anon key with auth
const { data } = await supabase.auth.getSession();
```

### Problem: Users can't see their orders after RLS enabled

**Reason:** Orders policy requires authenticated user

**Solution:** Ensure user is logged in before viewing orders

### Problem: Cart items not displaying

**Reason:** product_variants RLS blocking unauthenticated reads

**Solution:** Public should be able to read variants - verify SELECT policy is enabled

### Problem: Products not showing in marketplace

**Reason:** products SELECT policy might be too restrictive

**Solution:** Run test to verify public read access works

---

## Production Checklist

- [ ] RLS enabled on all tables
- [ ] All policies applied successfully
- [ ] `test-rls-access-control.js` passes with all checks ✓
- [ ] product_variants populated with all products
- [ ] Payment flow tested with real test account
- [ ] Users can create accounts
- [ ] Users can view products
- [ ] Users can add to cart
- [ ] Users can checkout with PayPal
- [ ] Orders stored in database
- [ ] Admins can view all orders
- [ ] Vendors can view own payouts

---

## Manual Policy Application (If Needed)

If the SQL script doesn't work, apply policies individually:

### Enable RLS on specific table
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

### Create a single policy
```sql
CREATE POLICY "products_allow_read" 
  ON products FOR SELECT 
  USING (true);
```

### Drop and recreate
```sql
DROP POLICY IF EXISTS "products_allow_read" ON products;
CREATE POLICY "products_allow_read" 
  ON products FOR SELECT 
  USING (true);
```

---

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Security policies template: `DATABASE_VERIFICATION_REPORT.md`

---

## Support

If you encounter issues:

1. Check `test-rls-access-control.js` output for specific failures
2. Verify policies in Supabase dashboard → SQL Editor
3. Review error messages in browser console
4. Check backend logs for API errors

---

**Next Steps:**
1. ✅ Run `test-database-schema.js` (verify current state)
2. ✅ Run SQL migration to enable RLS
3. ✅ Populate product_variants
4. ✅ Run `test-rls-access-control.js` (verify policies work)
5. ✅ Test payment flow with real account
6. ✅ Deploy to production

