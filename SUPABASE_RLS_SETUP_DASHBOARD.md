# Supabase Dashboard: RLS Setup Instructions

## Step-by-Step Screenshots & Instructions

---

## 1. Access Supabase SQL Editor

### Navigate to SQL Editor:
1. Open https://app.supabase.com in browser
2. You should see your projects list
3. Click on **skn** project
4. On left sidebar, click **SQL Editor** (or Ctrl+K, search "SQL")

### Or direct URL:
- Replace `PROJECT_ID` with your project ID:
- `https://app.supabase.com/project/PROJECT_ID/sql/new`

---

## 2. Create New Query for RLS Migration

### Steps:
1. Click **"New query"** button (top left)
2. You'll see blank SQL editor

### Alternative:
- Click existing query and select **"Duplicate"**

---

## 3. Copy & Paste RLS SQL Migration

### Open the file:
```
supabase_migrations/enable-rls-all-tables.sql
```

### Copy all contents (Ctrl+A, Ctrl+C)

### Paste into Supabase SQL Editor (Ctrl+V)

### Your screen should show:
```sql
-- Enable RLS and Apply Security Policies
-- Run this script in Supabase SQL Editor

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
-- ... (and more)
```

---

## 4. Execute the SQL

### Method 1: Click Run Button
- Look for green **"Run"** button (top right)
- Or press **Ctrl+Enter**
- You should see results panel at bottom

### Method 2: Watch for Execution
- Status indicator shows "Running..."
- Then "Execution completed"
- Check for errors (red text)

### Expected Result:
```
Execution completed
(no results, just success)
```

---

## 5. Verify RLS was Enabled

### Run verification query:
In the same SQL editor, add this query:

```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Expected output:
```
| tablename       | rowsecurity |
|-----------------|-------------|
| order_items     | t           | ← t = true (RLS enabled)
| orders          | t           |
| payouts         | t           |
| product_variants| t           |
| products        | t           |
| profiles        | t           |
| reviews         | t           |
```

---

## 6. Check Policies Created

### Run this query:
```sql
-- List all RLS policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Expected: 15+ policies like:
```
| tablename        | policyname                    | cmd  |
|------------------|-------------------------------|------|
| order_items      | order_items_allow_backend     | ALL  |
| order_items      | order_items_allow_read        | SELECT |
| orders           | orders_allow_backend          | ALL  |
| orders           | orders_allow_read_admin       | SELECT |
| orders           | orders_allow_read_own         | SELECT |
| product_variants | product_variants_allow_read   | SELECT |
| product_variants | product_variants_allow_write  | ALL  |
| products         | products_allow_admin_delete   | DELETE |
| products         | products_allow_admin_update   | UPDATE |
| products         | products_allow_admin_write    | INSERT |
| products         | products_allow_read           | SELECT |
| profiles         | profiles_allow_read_admin     | SELECT |
| profiles         | profiles_allow_read_own       | SELECT |
| profiles         | profiles_allow_service_role   | ALL  |
| profiles         | profiles_allow_update_own     | UPDATE |
| payouts          | payouts_allow_backend         | ALL  |
| payouts          | payouts_allow_read_admin      | SELECT |
| payouts          | payouts_allow_read_own        | SELECT |
| reviews          | reviews_allow_admin           | DELETE |
| reviews          | reviews_allow_create          | INSERT |
| reviews          | reviews_allow_read            | SELECT |
| reviews          | reviews_allow_update_own      | UPDATE |
```

✓ If you see all these policies, RLS is correctly enabled!

---

## 7. Populate Product Variants

### Create new query (repeat step 2)

### Open & copy:
```
supabase_migrations/populate-product-variants.sql
```

### Paste into new SQL editor query

### Execute (Ctrl+Enter)

### Expected output:
```
Execution completed
(no results, just success)
```

### Verify it worked:
```sql
-- Check variant count
SELECT COUNT(*) as variant_count FROM product_variants;

-- Check products with variants
SELECT 
  p.title,
  COUNT(pv.id) as variant_count,
  pv.price_in_cents
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
GROUP BY p.id, p.title, pv.price_in_cents
LIMIT 10;
```

---

## 8. View Database Schema

### See table structure in dashboard:
1. Click **Database** (left sidebar)
2. Select **Tables**
3. Click each table to view columns:
   - products
   - product_variants
   - profiles
   - orders
   - order_items
   - payouts
   - reviews

### Click table → **RLS** tab:
- Shows all policies for that table
- You should see multiple policies per table

---

## Troubleshooting in Supabase Dashboard

### Issue: SQL Error on Execute

**Error message like:**
```
ERROR: permission denied for schema public
```

**Solution:**
- Verify you have database admin role
- Check if another query is holding a lock
- Try refreshing page and retry

### Issue: Policies Not Showing

**In SQL editor:**
```sql
-- Check what policies exist
SELECT * FROM pg_policies 
WHERE tablename = 'orders';
```

**If empty:** RLS migration didn't run successfully

### Issue: Still Can Access Everything

**Run test:**
```bash
node test-rls-access-control.js
```

**If test shows failure:** Check policies again in dashboard

---

## After Completing These Steps

### 1. Back in Terminal:
```bash
node test-rls-access-control.js
```

Should show:
```
RLS Policy Tests: 5/5 passed ✓
```

### 2. Test Payment Flow:
```bash
npm run dev
```

### 3. Verify in Browser:
- Visit http://localhost:3000
- Add product to cart
- Checkout should work
- No "RLS violation" errors

---

## Common Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| RLS not enabled | Test shows 0/7 | Re-run migration SQL |
| Policies not created | Specific policy missing | Copy individual policy from template |
| Cart broken | "Cannot read properties" | Variants populated? Check product_variants has data |
| 403 errors in console | API calls blocked | Verify policies allow anon for products |
| Users can't see own orders | Orders showing empty | Check user is logged in + order user_id matches |

---

## Security Checklist - Before Going Live

In Supabase SQL Editor, verify:

```sql
-- 1. All tables have RLS enabled
SELECT COUNT(*) FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;
-- Should return: 0 (none without RLS)

-- 2. Products/reviews are publicly readable
SELECT policyname FROM pg_policies 
WHERE tablename = 'products' AND cmd = 'SELECT';
-- Should return: products_allow_read

-- 3. Orders are private
SELECT policyname FROM pg_policies 
WHERE tablename = 'orders' AND cmd = 'SELECT';
-- Should return: orders_allow_read_own, orders_allow_read_admin

-- 4. Profiles are private
SELECT policyname FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'SELECT';
-- Should return: profiles_allow_read_own, profiles_allow_read_admin

-- 5. Variants populated
SELECT COUNT(*) FROM product_variants;
-- Should return: > 0 (matches product count)
```

---

## Dashboard Navigation Quick Reference

| Task | Path |
|------|------|
| SQL Editor | Left sidebar → SQL Editor |
| Database Schema | Left sidebar → Database → Tables |
| User Management | Left sidebar → Authentication |
| RLS Policies | Database → Table name → RLS |
| API Keys | Settings → API → Project API Keys |
| Logs | Left sidebar → Logs |

---

## Still Having Issues?

1. **Check error message** in Supabase dashboard
2. **Review policies** in Database → Table → RLS tab
3. **Run test** to identify specific problem:
   ```bash
   node test-rls-access-control.js
   ```
4. **Check backend logs** for service role issues

---

**Expected Time to Complete:** ~15 minutes total
- RLS migration: 2 min
- Variant population: 1 min
- Verification: 2 min
- Testing: 10 min

After this, your database is secure! ✓
