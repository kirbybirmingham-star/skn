# Supabase Service Role & RLS Troubleshooting Guide

## Current Status

Your Supabase environment has **mixed success**:

### ✓ Working
- **Service Role Key**: Valid and authenticated ✓
- **Auth Admin Operations**: Can list/create users ✓
- **Storage Buckets**: Both `avatar` and `listings-images` exist ✓
- **Database Connection**: Connected to correct project ✓

### ❌ Failing
- **`profiles` table access**: RLS blocks all queries with "permission denied for schema public"
- **`products` table access**: RLS blocks all queries with "permission denied for schema public"

## Root Cause

The `profiles` and `products` tables have Row-Level Security (RLS) **enabled with policies that even block the service role**. This is unusual because:

- Service role key should **bypass RLS policies** in most cases
- The error "permission denied for schema public" suggests **schema-level permissions** are missing, not just table policies

## Solution: Apply RLS Policy Fix

The fix from `RLS_FIX_GUIDE.md` needs to be applied to the `profiles` table. Here's the exact SQL:

### Step 1: Apply in Supabase SQL Editor

**URL**: https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new

**SQL to run**:

```sql
-- Migration: Fix Profiles RLS Policies
-- Purpose: Allow service role and authenticated users to access profiles

BEGIN;

-- Drop overly restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new policies that allow service role bypass
CREATE POLICY "Everyone can view profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can delete profiles" ON public.profiles
    FOR DELETE USING (auth.jwt()->>'role' = 'service_role');

COMMIT;
```

**Click "Run"** and confirm "Success. No rows returned."

### Step 2: Fix Products Table (Same Issue)

The `products` table likely has the same problem. Run this SQL:

```sql
-- Fix Products Table RLS Policies

BEGIN;

-- Check current policies and fix if needed
DROP POLICY IF EXISTS "Anyone can view published products" ON public.products;
DROP POLICY IF EXISTS "Vendors can manage their own products" ON public.products;

-- Create accessible policies
CREATE POLICY "Everyone can view products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Vendors can manage products" ON public.products
    FOR ALL USING (
        auth.jwt()->>'role' = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.vendors v 
            WHERE v.id = products.vendor_id AND v.owner_id = auth.uid()
        )
    );

COMMIT;
```

**Click "Run"**

### Step 3: Verify the Fix

Run this command to test:

```powershell
node .\scripts\diagnose-service-role.js
```

Expected output after fix:
```
3. Testing profiles table SELECT...
   ✓ SUCCESS: Can query profiles. Count: X
   
4. Testing products table SELECT...
   ✓ SUCCESS: Can query products. Count: Y
```

### Step 4: Run Image Upload

Once the fix is verified, run:

```powershell
node .\scripts\upload-sample-images.js
```

Expected output:
```
Service role test: RPC succeeded (using service role).
Using service role? true
...
Processing images for product: laptop
✓ Main image uploaded
✓ Gallery image 1 uploaded
✓ Gallery image 2 uploaded
✓ Thumbnail uploaded
✓ Product record updated with image URLs
```

## Why This Happens

Supabase RLS **always applies**, even to the service role, unless:
1. RLS is **disabled** on the table (not recommended)
2. Policies explicitly allow the operation with `auth.jwt()->>'role' = 'service_role'`
3. Your database role has schema-level `USAGE` privileges

The policies in your migrations (`align_schema_with_seed.sql`) were too restrictive and didn't account for backend/service role access.

## Diagnosis Commands

Created helper scripts to debug:

```powershell
# Comprehensive service role diagnostics
node .\scripts\diagnose-service-role.js

# Test database access only
node .\scripts\test-supabase.js --verbose

# Test storage upload specifically
node .\scripts\upload-sample-images.js
```

## Schema Overview

Your database has these tables with RLS enabled:
- `public.profiles` — User profiles
- `public.products` — Product catalog
- `public.vendors` — Vendor information
- `public.product_variants` — Product variants
- `public.categories` — Product categories

All need policies that allow service role access OR explicitly bypass RLS.

## Reference: Policy Best Practices

### For Backend Scripts (Service Role)
```sql
-- Allow service role to perform all operations
CREATE POLICY "Service role full access" ON public.your_table
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');
```

### For Authenticated Users
```sql
-- Allow users to manage their own data
CREATE POLICY "Users can manage own records" ON public.your_table
    FOR ALL USING (user_id = auth.uid());
```

### For Public Read
```sql
-- Allow anyone to read (good for product catalog)
CREATE POLICY "Anyone can read" ON public.products
    FOR SELECT USING (true);
```

---

**Need help?** Run `node .\scripts\diagnose-service-role.js` after applying fixes and share the output if issues persist.
