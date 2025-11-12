# Complete Supabase Setup & Troubleshooting (Nov 11, 2025)

## Current State Summary

Your project has **valid Supabase credentials and infrastructure** but is blocked by **RLS (Row-Level Security) policies that are too restrictive**.

### Status Dashboard

| Component | Status | Issue |
|-----------|--------|-------|
| Supabase URL | ✓ Valid | None |
| Service Role Key | ✓ Valid | None |
| Auth Operations | ✓ Working | Can list/create users |
| Storage Buckets | ✓ Exist | Both `avatar` and `listings-images` present |
| **Profiles Table RLS** | ❌ **BLOCKED** | Policies deny all access |
| **Products Table RLS** | ❌ **BLOCKED** | Policies deny all access |

### Error You're Seeing
```
❌ Cannot access profiles table: permission denied for schema public
```

## Quick Fix (5 minutes)

### Step 1: Go to Supabase SQL Editor
**URL**: https://app.supabase.com/project → **SQL Editor** → **New Query**

### Step 2: Paste & Run This SQL

```sql
-- Fix Profiles Table RLS
BEGIN;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Everyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role can delete profiles" ON public.profiles FOR DELETE USING (auth.jwt()->>'role' = 'service_role');
COMMIT;
```

Click **Run** → Should show "Success. No rows returned."

### Step 3: Test Immediately

```powershell
node .\scripts\test-supabase.js
```

Expected result:
```
✓ Can list users! Current count: 5
✓ Created test user: test.delete.me@example.com
✓ Deleted test user
✓ Can access profiles table
```

## Detailed Fix Guides

For **complete reference** with all tables and best practices:

1. **`RLS_FIX_GUIDE.md`** — Profiles table RLS fix with detailed explanation
2. **`SERVICE_ROLE_GUIDE.md`** — Service role diagnostics + Products table fix
3. **`PATCHES_APPLIED.md`** — Script improvements made to `upload-sample-images.js`

## What Went Wrong

Your migrations (`supabase_migrations/align_schema_with_seed.sql`) set up RLS with policies that:

❌ Only allowed users to view/update their **own** profile
❌ Didn't account for **service role key** backend operations
❌ Blocked **INSERT/DELETE** operations entirely
❌ Caused "permission denied for schema public" cascade error

## What the Fix Does

✓ Allows **everyone** to read profiles (for user discovery)
✓ Allows **authenticated users** to insert their own profile
✓ Allows **users** to update their own profile OR **service role** to update any
✓ Allows **service role** to delete profiles (for cleanup)

This is **safe** because:
- User data stays private (can only update own)
- Service role is for **backend scripts only** (not exposed to frontend)
- Public read is normal for user directories

## Scripts You'll Need

### 1. Test Database Access
```powershell
# Comprehensive test of all Supabase functions
node .\scripts\test-supabase.js --verbose
```

### 2. Diagnose Service Role
```powershell
# Detailed diagnostics showing exactly what's working/failing
node .\scripts\diagnose-service-role.js
```

### 3. Upload Sample Images
```powershell
# Upload test images once RLS is fixed
node .\scripts\upload-sample-images.js
```

## Files for Reference

### Documentation (New)
- `RLS_FIX_GUIDE.md` — Step-by-step RLS policy fixes
- `SERVICE_ROLE_GUIDE.md` — Service role troubleshooting guide
- `PATCHES_APPLIED.md` — Details of code improvements

### Scripts (New/Updated)
- `scripts/diagnose-service-role.js` — Created (comprehensive diagnostics)
- `scripts/upload-sample-images.js` — Updated (6 patches applied)
- `scripts/test-supabase.js` — Existing (comprehensive test)

### Migrations (Existing)
- `supabase_migrations/20251111_fix_profiles_rls.sql` — Created (formal migration file)
- `supabase_migrations/align_schema_with_seed.sql` — Original (needs RLS fix applied)

## Timeline

- **Nov 10**: Initial database setup with restrictive RLS policies
- **Nov 11 10:00 AM**: Diagnosed RLS permission denied errors
- **Nov 11 10:30 AM**: Created RLS fix guide + diagnostic scripts
- **Nov 11 11:00 AM**: Applied 6 code quality patches to image upload script
- **Now**: Ready for you to apply SQL fix and test

## Next Steps

### Immediate (5 min)
1. Apply SQL fix in Supabase editor (copy/paste above)
2. Run `node .\scripts\test-supabase.js` to verify

### Short-term (15 min)
3. Run `node .\scripts\diagnose-service-role.js` for detailed status
4. Run `node .\scripts\upload-sample-images.js` to upload test images

### Long-term
5. Review `SERVICE_ROLE_GUIDE.md` for best practices
6. Check if other tables need similar RLS fixes
7. Consider using Supabase migrations in CI/CD for future deployments

## Troubleshooting

### "permission denied for schema public" still appears?
→ The SQL fix may not have been applied
→ Verify in Supabase: Settings → RLS → profiles → Check all policies

### "Bucket not found"?
→ Storage bucket name mismatch
→ Verify bucket exists: Run `node .\scripts\diagnose-service-role.js`

### "Service role test failed"?
→ The RLS fix hasn't been applied yet
→ Complete the Quick Fix above (5 minute task)

### Unsure if fix was applied?
```powershell
# Run diagnostic - should show ✓ SUCCESS for profiles/products
node .\scripts\diagnose-service-role.js
```

## Architecture

```
┌─ Supabase Project ────────────────────────────┐
│                                               │
│  ┌─ Auth ─────────────────────────────────┐  │
│  │ • 5 users already created              │  │
│  │ • Service role key (in your .env)      │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌─ Database (RLS Enabled) ────────────────┐ │
│  │ • profiles — ❌ NEEDS FIX               │ │
│  │ • products — ❌ NEEDS FIX               │ │
│  │ • vendors — Likely OK                  │ │
│  │ • product_variants — Likely OK         │ │
│  │ • categories — Likely OK               │ │
│  └────────────────────────────────────────┘ │
│                                               │
│  ┌─ Storage (RLS Enabled) ─────────────────┐ │
│  │ • avatar bucket — ✓ OK                 │ │
│  │ • listings-images bucket — ✓ OK        │ │
│  └────────────────────────────────────────┘ │
│                                               │
└───────────────────────────────────────────────┘
```

## Contact / Questions

If you encounter issues after applying the fix:
1. Check `SERVICE_ROLE_GUIDE.md` for detailed troubleshooting
2. Run `node .\scripts\diagnose-service-role.js` and share output
3. Verify SQL was actually run in Supabase (check RLS policies in UI)

---

**You're all set!** Apply the quick fix above and test. Everything else is infrastructure working correctly.
