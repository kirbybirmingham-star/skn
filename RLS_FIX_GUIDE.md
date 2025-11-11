# Supabase Profiles Table RLS Fix

## Issue
The test script (`scripts/test-supabase.js`) fails when trying to query the `profiles` table with the error:
```
❌ Cannot access profiles table: permission denied for schema public
```

## Root Cause
The `profiles` table has Row-Level Security (RLS) **enabled** but the existing policies were too restrictive:

**Original Policies** (in `supabase_migrations/align_schema_with_seed.sql`):
```sql
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
```

**Problems:**
1. **No SELECT policy for service_role**: The service role key (used by backend scripts) still respects RLS and hits the restrictive policy that only allows viewing your own profile
2. **Missing INSERT policy**: When creating new profiles, there's no policy to allow it
3. **Missing DELETE policy**: Cleanup scripts cannot delete profiles
4. **RLS blocks schema access**: When all SELECT operations are blocked, even checking table existence fails with "permission denied for schema public"

## Solution
Update the `profiles` table RLS policies to:
1. Allow **public read** of all profiles (for discovery/display)
2. Allow **authenticated INSERT** for own profile
3. Allow **UPDATE** for own profile OR service_role
4. Allow **DELETE** for service_role only

## How to Apply the Fix

### Option 1: Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard: https://app.supabase.com/project
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Paste the following SQL:

```sql
-- Migration: Fix Profiles RLS Policies
-- Date: 2025-11-11

BEGIN;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

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

5. Click **Run**
6. You should see "Success. No rows returned."

### Option 2: Using psql (if you have PostgreSQL installed)

Extract the connection details from your `.env`:
- `VITE_SUPABASE_URL` → extract `db.{PROJECT_ID}.postgres.supabase.co`
- `SUPABASE_DB_PASSWORD` → your database password

```bash
# Replace with your actual credentials
$env:PGPASSWORD="YOUR_DB_PASSWORD"
psql -h "db.YOUR_PROJECT_ID.postgres.supabase.co" -U "postgres" -d "postgres" -c @"
BEGIN;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Everyone can view profiles" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role can delete profiles" ON public.profiles
    FOR DELETE USING (auth.jwt()->>'role' = 'service_role');
COMMIT;
"@
```

## Verification

After applying the fix, run:

```powershell
node .\scripts\test-supabase.js --verbose
```

You should see:
```
3. Testing database access...
✓ Can access profiles table
```

## What Each Policy Does

| Policy | Operation | Condition | Purpose |
|--------|-----------|-----------|---------|
| Everyone can view profiles | SELECT | `true` | Any user (auth or anon) can read profiles |
| Authenticated users can insert own profile | INSERT | `auth.uid() = id` | Users can only create their own profile |
| Users can update own profile | UPDATE | `auth.uid() = id OR auth.jwt()->>'role' = 'service_role'` | Users can update their own profile; backend can update any |
| Service role can delete profiles | DELETE | `auth.jwt()->>'role' = 'service_role'` | Only backend/service role can delete profiles |

## Affected Scripts
These scripts should now work correctly after the fix:
- `scripts/test-supabase.js` — tests database access
- `scripts/seed.js` and variants — create initial profiles
- `scripts/inspect-db.js` — query profiles for debugging
- `scripts/cleanup-*.js` — delete profiles for cleanup
- Frontend auth flow — can create and read user profiles

## Migration File
A formal migration file has been created at:
```
supabase_migrations/20251111_fix_profiles_rls.sql
```

This can be auto-applied in future deployments if you have a migration runner configured.

---

**Questions?**
- Check Supabase docs on RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Review migration files in `supabase_migrations/` to understand current schema setup
