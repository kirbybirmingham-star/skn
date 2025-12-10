# 📋 RLS Policies Quick Reference

## What is RLS?
**Row Level Security (RLS)** controls which rows users can access in each table.

When RLS is enabled without public read policies:
- ❌ Anonymous users see no data
- ❌ Frontend queries return empty results
- ✅ Service role (backend) can see everything

## Quick Check: Is RLS Blocking Me?

```javascript
// Test in browser console
const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
const supabase = createClient('YOUR_URL', 'YOUR_ANON_KEY');
const { data } = await supabase.from('products').select('id').limit(1);
console.log(data?.length > 0 ? '✅ Works' : '❌ RLS Blocking');
```

## RLS Policies Needed for Frontend

| Table | Policy Name | Operation | Condition | Status |
|-------|------------|-----------|-----------|--------|
| `products` | Allow public read | SELECT | `true` | ✅ Applied |
| `product_variants` | Allow public read variants | SELECT | `true` | ✅ Applied |
| `product_ratings` | Allow public read ratings | SELECT | `true` | ✅ Applied |
| `vendors` | Allow public read | SELECT | `true` | ✅ Applied |
| `profiles` | Allow public read profiles | SELECT | `true` | ✅ Applied |

## SQL Template

For any table needing public read access:

```sql
-- Enable RLS
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Add public read policy
DROP POLICY IF EXISTS "Allow public read" ON [table_name];
CREATE POLICY "Allow public read" ON [table_name]
  FOR SELECT
  USING (true);
```

## Testing RLS

```bash
# Quick test
node scripts/test-product-access.js

# Test specific table
node -e "
import('dotenv/config').then(() => {
  import('@supabase/supabase-js').then(({ createClient }) => {
    const client = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
    (async () => {
      const { data, error } = await client
        .from('[TABLE_NAME]')
        .select('id')
        .limit(1);
      console.log(error ? '❌ ' + error.message : '✅ Success: ' + data?.length);
    })();
  });
});
"
```

## Common RLS Issues & Fixes

### Issue: "column [x] does not exist"
**Cause:** Schema mismatch  
**Fix:** Check actual column names - use `SELECT *` then adjust

### Issue: Empty array returned
**Cause:** RLS policy missing or too restrictive  
**Fix:** Add public read policy with `USING (true)`

### Issue: 404 on REST API endpoint
**Cause:** RLS blocking access to table itself  
**Fix:** Add public read policy

### Issue: Only service role can read
**Cause:** RLS enabled but no public policy  
**Fix:** Add policy with `FOR SELECT USING (true)`

## Column Name Mapping

Use this when schema doesn't match expectations:

| Expected | Actual | Table | Status |
|----------|--------|-------|--------|
| `business_name` | `name` | vendors | ✅ Fixed in API |
| `name` (vendor name) | `name` | vendors | ✅ Working |
| `store_name` | `store_name` | vendors | ✅ Working |

## Files That Were Fixed

- ✅ `src/api/EcommerceApi.jsx` - Column names corrected
- ✅ `src/lib/variantSelectHelper.js` - Fallback logic added
- ✅ `src/lib/ratingsChecker.js` - Error handling improved

## Pages Now Working

- ✅ `/` - Home page with products
- ✅ `/marketplace` - Product listings
- ✅ `/product/[id]` - Product details
- ✅ `/store` - Vendor listing with cards
- ✅ `/store/[id]` - Individual store page

## Debugging Tips

### Enable verbose logging
```javascript
// In browser console
localStorage.debug = '*'
// Then reload page
```

### Check what the API is actually querying
Look for these log prefixes:
- `[variantSelectHelper]` - Variant query info
- `[getProductById]` - Product fetch details
- `[ratingsChecker]` - Ratings table check

### Inspect Supabase directly
```bash
# Check if table has RLS enabled
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename = '[table_name]';

# Check policies
SELECT * FROM pg_policies 
WHERE tablename = '[table_name]';
```

## When Adding New Tables

**Always remember:**
```sql
ALTER TABLE [new_table] ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON [new_table] FOR SELECT USING (true);
```

Don't forget public read policies! They're easy to skip and cause mysterious empty results.

---

**Last Updated:** December 9, 2025  
**Status:** All policies applied and tested ✅
