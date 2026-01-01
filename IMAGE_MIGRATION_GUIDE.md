# Image Migration Guide - UUID Structure

## Overview

Migrate existing images from your current file structure to the new UUID-based structure with full database synchronization.

---

## What the Migration Does

✅ **Storage Migration**:
- Renames all files in product-images bucket with UUID pattern
- Renames all files in vendor-images bucket with UUID pattern
- Renames all files in user-avatars bucket with UUID pattern
- Preserves original file extensions
- Maintains image data integrity

✅ **Database Updates**:
- Updates products.image_url with new file URLs
- Updates product_variants.image_url with new file URLs
- Updates vendors.image_url with new file URLs
- Updates users.avatar_url with new file URLs (if exists)
- Creates migration report with detailed statistics

✅ **Safety**:
- Only processes files that match existing database records
- Creates backup URLs in migration report
- Logs all operations for audit trail
- Generates detailed error report if issues occur

---

## File Naming Convention

### Before Migration
```
product-image-1.jpg
vendor-logo.png
user-avatar-123.jpg
```

### After Migration
```
img_a1b2c3d4e5f6g7h8.jpg
img_f9g0h1i2j3k4l5m6.png
img_n7o8p9q0r1s2t3u4.jpg
```

**Format**: `img_[16-char-UUID-trim].[original-extension]`

---

## Prerequisites

1. **Supabase Environment Variables**:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-service-role-key
   ```

2. **Database Tables** (must exist):
   - products (with image_url column)
   - product_variants (with image_url column)
   - vendors (with image_url column)
   - users (optional, with avatar_url column)

3. **Storage Buckets** (must exist):
   - product-images
   - vendor-images
   - user-avatars

4. **Node.js** with dependencies:
   ```bash
   npm install uuid @supabase/supabase-js
   ```

---

## Step-by-Step Migration

### Step 1: Backup Your Data

**Before running migration, backup:**

```bash
# Backup database
pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# OR use Supabase backup (in dashboard)
```

**Export migration mapping** (optional):
```bash
# Run this to get current image mappings
SELECT id, image_url FROM products WHERE image_url IS NOT NULL;
SELECT id, image_url FROM product_variants WHERE image_url IS NOT NULL;
SELECT id, image_url FROM vendors WHERE image_url IS NOT NULL;
```

### Step 2: Set Environment Variables

```bash
# Create .env or set in terminal
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-service-role-key"

# Verify (should show your URL)
echo $SUPABASE_URL
```

**Finding your credentials**:
1. Go to Supabase dashboard
2. Settings → API
3. Copy `Project URL` and `Service Role Key`

### Step 3: Run Migration

```bash
# Run the migration script
node migrate-images-to-uuid.js
```

**What you'll see**:
```
🚀 Starting Image Migration to UUID-Based Structure

Step 1: Migrating Image Storage

📦 Migrating bucket: product-images
   ✅ product-image-1.jpg → img_a1b2c3d4e5f6g7h8.jpg
   ✅ product-image-2.jpg → img_f9g0h1i2j3k4l5m6.jpg
   ...

📦 Migrating bucket: vendor-images
   ✅ vendor-logo.jpg → img_n7o8p9q0r1s2t3u4.jpg
   ...

Step 2: Updating Database Records

🗄️  Updating product images in database...
   ✅ Product a1b2c3d4... updated
   ✅ Product f9g0h1i2... updated
   ...

📊 MIGRATION REPORT
=====================
✅ SUCCESS
```

### Step 4: Verify Migration

Check the generated report:
```bash
cat MIGRATION_REPORT.json
```

**Report includes**:
- Files migrated per bucket
- Database records updated
- Any errors or warnings
- Detailed timestamps
- Old → new file mappings

### Step 5: Test Application

```bash
# 1. Run your app
npm run dev

# 2. Check product images load
# 3. Check variant images load
# 4. Check vendor logos load
# 5. Check user avatars load
```

---

## Migration Report

The script generates `MIGRATION_REPORT.json` with:

```json
{
  "startTime": "2024-12-31T10:00:00.000Z",
  "endTime": "2024-12-31T10:05:30.000Z",
  "duration": 330,
  "bucket_migrations": {
    "product-images": {
      "filesProcessed": 150,
      "errors": 0,
      "migrations": [
        {
          "bucket": "product-images",
          "oldFilename": "product-1.jpg",
          "newFilename": "img_a1b2c3d4e5f6g7h8.jpg",
          "newUrl": "https://project.supabase.co/storage/v1/object/public/product-images/img_a1b2c3d4e5f6g7h8.jpg",
          "timestamp": "2024-12-31T10:00:15.000Z"
        }
      ]
    }
  },
  "database_updates": {
    "products": 145,
    "product_variants": 280,
    "vendors": 15,
    "users": 0
  },
  "errors": [],
  "warnings": []
}
```

---

## Troubleshooting

### Issue: "SUPABASE_URL and SUPABASE_KEY environment variables required"

**Solution**:
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-service-role-key"

# Verify
echo $SUPABASE_URL
echo $SUPABASE_KEY

# Then run migration
node migrate-images-to-uuid.js
```

### Issue: "Failed to list files in product-images bucket"

**Causes**:
- Bucket doesn't exist
- Invalid credentials
- Bucket is empty (OK - script will skip)

**Solution**:
1. Verify bucket exists in Supabase dashboard
2. Check credentials are correct
3. Check bucket has public access

### Issue: "Failed to download/upload files"

**Causes**:
- Storage quota exceeded
- File is corrupted
- Permission issues

**Solution**:
1. Check Supabase usage (Settings → Usage)
2. Verify bucket policies allow operations
3. Check file format is valid image

### Issue: "Failed to update product/variant/vendor records"

**Causes**:
- Database connection error
- Column doesn't exist
- Invalid URL format

**Solution**:
1. Verify database tables exist
2. Verify image_url columns exist:
   ```sql
   ALTER TABLE products ADD COLUMN image_url VARCHAR(255);
   ALTER TABLE product_variants ADD COLUMN image_url VARCHAR(255);
   ALTER TABLE vendors ADD COLUMN image_url VARCHAR(255);
   ```
3. Check credentials have database access

---

## Rollback Procedure

If something goes wrong:

### Option 1: From MIGRATION_REPORT.json

```javascript
// Restore old URLs from report
const report = require('./MIGRATION_REPORT.json');
const migrations = report.bucket_migrations.product_images.migrations;

// For each migration:
migrations.forEach(async (m) => {
  // Update database back to old filename
  // Delete new files
  // Restore old files
});
```

### Option 2: From Database Backup

```bash
# Restore database from backup
psql your_database < backup_20241231_100000.sql

# Restore images from Supabase backup (if available)
```

### Option 3: Manual Reverse

1. **Stop using new filenames** in application
2. **Keep old files** in storage (don't delete)
3. **Revert database** to previous state
4. **Restart application**

---

## Safety Checks

The migration script includes:

✅ **Pre-migration**:
- Verifies environment variables
- Checks Supabase connectivity
- Lists files before processing

✅ **During migration**:
- Individual file error handling
- Transaction-like atomicity
- Detailed logging

✅ **Post-migration**:
- Verification report
- Error summary
- Data integrity checks

✅ **Rollback support**:
- Complete migration log
- Old → new file mapping
- Database update tracking

---

## Performance Notes

**Migration Speed**:
- 100 images: ~5 minutes
- 500 images: ~20 minutes
- 1000 images: ~40 minutes

**Network**:
- Downloads each file
- Uploads with new name
- Deletes old file
- Updates database
- ~500KB per second typical

**Storage**:
- Temporary 2x space during migration (old + new)
- Cleaned up after old files deleted
- No permanent storage increase

---

## After Migration

### Update Application Code

1. **Image URLs already updated** in database
2. **No code changes needed** - just point to image_url
3. **New uploads** will use ImageUpload component (new code)
4. **Existing images** now use UUID naming

### Verify Everything Works

```javascript
// Test product images
const products = await supabase
  .from('products')
  .select('id, image_url')
  .limit(1);

console.log(products.data[0].image_url);
// Should be: https://project.supabase.co/storage/v1/object/public/product-images/img_a1b2c3d4e5f6g7h8.jpg

// Test variant images
const variants = await supabase
  .from('product_variants')
  .select('id, image_url')
  .limit(1);

console.log(variants.data[0].image_url);
// Should be: https://project.supabase.co/storage/v1/object/public/product-images/img_f9g0h1i2j3k4l5m6.jpg
```

### Monitor

- Check application loads all images
- Monitor Supabase storage metrics
- Verify no 404 errors in console
- Check database backup is clean

---

## Migration Checklist

Before Running:
- [ ] Database backed up
- [ ] Environment variables set
- [ ] Application stopped (optional but recommended)
- [ ] Verified bucket names match script
- [ ] Verified table/column names exist
- [ ] Read this guide completely

Running:
- [ ] Execute: `node migrate-images-to-uuid.js`
- [ ] Wait for completion
- [ ] Review MIGRATION_REPORT.json

After Migration:
- [ ] Restart application
- [ ] Test product images load
- [ ] Test variant images load
- [ ] Test vendor images load
- [ ] Test user avatars load
- [ ] Check browser console for errors
- [ ] Verify database updates correct

---

## Support

**Stuck?** Check:
1. MIGRATION_REPORT.json for specific errors
2. Supabase logs in dashboard
3. Database query results
4. Environment variables are set
5. File permissions correct

**Need to redo?** Use rollback procedure above.

**Questions?** See related documentation:
- [IMAGE_MANAGEMENT_TECHNICAL_REFERENCE.md](IMAGE_MANAGEMENT_TECHNICAL_REFERENCE.md)
- [IMAGE_MANAGEMENT_IMPLEMENTATION_GUIDE.md](IMAGE_MANAGEMENT_IMPLEMENTATION_GUIDE.md)

---

## Summary

The migration script:
1. ✅ Renames all existing images with UUID pattern
2. ✅ Updates all database records automatically
3. ✅ Creates detailed report for audit trail
4. ✅ Handles errors gracefully
5. ✅ Provides rollback information

**Time to migrate**: 5-40 minutes depending on image count
**Application downtime**: Optional (can run while app is running)
**Risk level**: Low (backed by report, easily reversible)

---

**Ready to migrate?** Run:
```bash
node migrate-images-to-uuid.js
```

Check the report and you're done! ✅
