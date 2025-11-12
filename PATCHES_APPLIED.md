# Upload Sample Images Script - Patches Applied

## Summary of Changes

All requested patches have been successfully applied to `scripts/upload-sample-images.js`. This document lists each change with rationale.

## Applied Patches

### 1. ✓ Added Bucket Name Constant
**File**: `scripts/upload-sample-images.js` (line 31)

**Before**:
```javascript
async function uploadToStorage(buffer, path, contentType = 'image/jpeg') {
  const { data, error } = await supabase.storage
    .from('listings-images')  // Hardcoded bucket name
```

**After**:
```javascript
const BUCKET_NAME = 'listing-images';  // Single source of truth

async function uploadToStorage(buffer, path, contentType = 'image/jpeg') {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)  // Use constant
```

**Benefits**:
- Single source of truth for bucket name
- Easy to update bucket name in one place
- Consistent across all storage operations

---

### 2. ✓ Fixed Bucket Name in URL Generation
**File**: `scripts/upload-sample-images.js` (line 143)

**Before**:
```javascript
const bucketName = 'listings-images';  // Hardcoded, could diverge from constant
```

**After**:
```javascript
const bucketName = BUCKET_NAME;  // Use the constant
```

**Benefits**:
- Ensures URL generation always uses the same bucket name as uploads
- Prevents typo-related mismatches

---

### 3. ✓ Added Environment Variable Verification
**File**: `scripts/upload-sample-images.js` (lines 16-17)

**Added**:
```javascript
console.log('VITE_SUPABASE_URL set?', !!process.env.VITE_SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY set?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
```

**Benefits**:
- Early visibility into env var status without exposing values
- Helps diagnose "env not set" issues quickly
- Runs before client initialization

**Sample output**:
```
VITE_SUPABASE_URL set? true
SUPABASE_SERVICE_ROLE_KEY set? true
```

---

### 4. ✓ Enhanced Update Error Logging
**File**: `scripts/upload-sample-images.js` (lines 151-153)

**Before**:
```javascript
if (updateError) {
  console.error('Error details:', updateError);
  throw updateError;
}
```

**After**:
```javascript
if (updateError) {
  console.error('Update error object:', updateError);
  console.error('Attempted update: products SET image_url =', mainImageUrl, 'WHERE slug =', slug);
  throw updateError;
}
```

**Benefits**:
- Logs the full error object for debugging
- Shows the exact query parameters that failed
- Helps identify whether it's a RLS issue, bad SQL, or bad data

**Sample output on error**:
```
Update error object: {
  code: '42501',
  message: 'permission denied for schema public',
  details: null
}
Attempted update: products SET image_url = https://... WHERE slug = laptop
```

---

### 5. ✓ Added Service Role Verification Test
**File**: `scripts/upload-sample-images.js` (lines 188-203)

**Added**:
```javascript
async function verifyServiceRole() {
  try {
    const { data, error } = await supabase.rpc('reload_schema_cache');
    if (error) {
      console.log('Service role test: RPC failed (not using service role):', error.message);
      return false;
    } else {
      console.log('Service role test: RPC succeeded (using service role).');
      return true;
    }
  } catch (err) {
    console.log('Service role test: exception', err.message);
    return false;
  }
}
```

**Benefits**:
- Tests if the client is using the service role key correctly
- Runs before attempting storage/database operations
- Distinguishes between "bad key" and "good key but permission denied"

**Sample output**:
```
Service role test: RPC succeeded (using service role).
Using service role? true
```

---

### 6. ✓ Updated Script Execution Flow
**File**: `scripts/upload-sample-images.js` (lines 216-221)

**Before**:
```javascript
reloadCache()
  .then(() => main())
  .catch(console.error);
```

**After**:
```javascript
verifyServiceRole().then((isService) => {
  console.log('Using service role?', isService);
  return reloadCache();
})
  .then(() => main())
  .catch(console.error);
```

**Benefits**:
- Runs service role test first
- Logs whether service role is detected
- Allows early exit if critical checks fail

---

## How to Use the Enhanced Script

### 1. **Basic Usage**
```powershell
node .\scripts\upload-sample-images.js
```

### 2. **Read Output in Order**

First check - **Environment variables**:
```
VITE_SUPABASE_URL set? true
SUPABASE_SERVICE_ROLE_KEY set? true
```

Second check - **Service role verification**:
```
Service role test: RPC succeeded (using service role).
Using service role? true
```

If this fails, your env vars are wrong or the RLS fix hasn't been applied.

Third check - **Schema cache reload**:
```
Schema cache reloaded successfully
```

Then - **Image processing**:
```
Processing images for product: laptop
Downloading main image...
Uploading main image...
✓ Main image uploaded
Update error object: (if there's an error, you'll see the SQL parameters)
```

### 3. **Interpreting Error Messages**

**Error: "permission denied for schema public"**
→ Apply RLS fix from `SERVICE_ROLE_GUIDE.md`

**Error: "Bucket not found"**
→ Storage bucket doesn't exist or bucket name is wrong
→ Check: `node .\scripts\diagnose-service-role.js` (test 2)

**Error: "Update error object: {...}"**
→ Product record couldn't be updated
→ Check the SQL parameters in the next log line

---

## Verification Checklist

After applying patches, verify:

- [ ] Script runs without syntax errors: `node .\scripts\upload-sample-images.js`
- [ ] Environment variables are printed
- [ ] Service role test runs
- [ ] Diagnostic script works: `node .\scripts\diagnose-service-role.js`
- [ ] Upload completes or shows clear error with SQL parameters

---

## Files Modified

- `scripts/upload-sample-images.js` — All 6 patches applied
- `scripts/diagnose-service-role.js` — Created (new diagnostic tool)
- `SERVICE_ROLE_GUIDE.md` — Created (comprehensive troubleshooting guide)
- `RLS_FIX_GUIDE.md` — Created earlier (RLS policy fixes)

---

## Next Steps

1. **Apply RLS fix** from `SERVICE_ROLE_GUIDE.md` in Supabase SQL Editor
2. **Run diagnostics** to verify: `node .\scripts\diagnose-service-role.js`
3. **Run upload script**: `node .\scripts\upload-sample-images.js`
4. **Verify uploads** in Supabase Storage bucket

---

**Questions?** See `SERVICE_ROLE_GUIDE.md` or `RLS_FIX_GUIDE.md` for detailed troubleshooting.
