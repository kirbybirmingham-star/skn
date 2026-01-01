# Image Migration - Complete Setup

## You Now Have 

✅ **Migration Script** (`migrate-images-to-uuid.js`)
- Migrates all existing images to UUID-based naming
- Updates all database records automatically
- Creates detailed migration report
- Handles errors and provides rollback info

✅ **Documentation** (3 files)
- Quick start guide for running migration
- Complete migration guide with troubleshooting
- Rollback procedures

---

## What the Migration Does

**Storage**:
1. Reads all files from product-images bucket
2. Reads all files from vendor-images bucket
3. Reads all files from user-avatars bucket
4. Renames each file: `old-name.jpg` → `img_a1b2c3d4e5f6g7h8.jpg`
5. Deletes old files after successful copy

**Database**:
1. Updates products.image_url with new file URLs
2. Updates product_variants.image_url with new file URLs
3. Updates vendors.image_url with new file URLs
4. Updates users.avatar_url with new file URLs (if exists)

**Report**:
1. Generates MIGRATION_REPORT.json with complete details
2. Lists all migrations
3. Counts updates per table
4. Records any errors or warnings

---

## Before You Migrate

### Checklist

- [ ] Database backed up
- [ ] Supabase credentials ready (Project URL + Service Role Key)
- [ ] All buckets exist (product-images, vendor-images, user-avatars)
- [ ] All table columns exist:
  ```sql
  -- Check these columns exist
  SELECT * FROM products LIMIT 0;       -- has image_url?
  SELECT * FROM product_variants LIMIT 0; -- has image_url?
  SELECT * FROM vendors LIMIT 0;        -- has image_url?
  ```

### Add Missing Columns

If columns are missing:
```sql
ALTER TABLE products ADD COLUMN image_url VARCHAR(255);
ALTER TABLE product_variants ADD COLUMN image_url VARCHAR(255);
ALTER TABLE vendors ADD COLUMN image_url VARCHAR(255);
```

---

## Run the Migration

### Step 1: Set Credentials

**In PowerShell (Windows)**:
```powershell
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_KEY="your-service-role-key"
```

**In Bash (Mac/Linux)**:
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-service-role-key"
```

### Step 2: Run Script

```bash
node migrate-images-to-uuid.js
```

### Step 3: Check Results

```bash
cat MIGRATION_REPORT.json
```

---

## Example Results

After successful migration, you'll see:

```
✅ SUCCESS

📦 Storage Migrations:
   product-images: 150 files migrated
   vendor-images: 15 files migrated
   user-avatars: 25 files migrated
   Total: 190 files migrated

🗄️  Database Updates:
   Products: 145 updated
   Variants: 280 updated
   Vendors: 15 updated
   Users: 0 updated
   Total: 440 records updated
```

**Images are now stored as**:
```
img_a1b2c3d4e5f6g7h8.jpg
img_f9g0h1i2j3k4l5m6.png
img_n7o8p9q0r1s2t3u4.jpg
```

---

## Verify It Worked

### Check Database

```javascript
// Products
const { data } = await supabase
  .from('products')
  .select('id, image_url')
  .limit(1);

console.log(data[0].image_url);
// Should be: https://project.supabase.co/storage/v1/object/public/product-images/img_a1b2c3d4e5f6g7h8.jpg
```

### Check Application

```bash
# Start your app
npm run dev

# Check images load in browser
# No 404 errors in console
# All images display correctly
```

---

## Files Reference

| File | Purpose | Size |
|------|---------|------|
| migrate-images-to-uuid.js | The migration script | 12KB |
| IMAGE_MIGRATION_QUICK_START.md | Quick reference | 4KB |
| IMAGE_MIGRATION_GUIDE.md | Complete guide | 15KB |
| MIGRATION_REPORT.json | Generated after migration | Varies |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Environment variables required" | Run `export SUPABASE_URL=...` first |
| "Failed to list files" | Check bucket exists and credentials are correct |
| "Failed to update database" | Check table/column exists in database |
| "Files not moving" | Check have write access to buckets |

**For detailed help**:
→ [IMAGE_MIGRATION_GUIDE.md](IMAGE_MIGRATION_GUIDE.md)

---

## Timeline

| Step | Time |
|------|------|
| Backup | 5 min |
| Setup credentials | 2 min |
| Run migration | 5-40 min (depends on image count) |
| Verify | 5 min |
| Restart app | 1 min |
| **Total** | **~20-50 minutes** |

---

## Key Points

✅ **Safe**: Creates detailed report of everything
✅ **Reversible**: Full old → new mapping in report
✅ **Automatic**: Updates database automatically
✅ **Complete**: Handles all buckets and tables
✅ **Verified**: Migration report shows success/errors

---

## What Happens to Old Files

The script:
1. Copies each file to new name
2. Verifies upload successful
3. Deletes old file
4. Updates database

If deletion fails:
- File stays in storage (doesn't delete)
- Script warns but continues
- You can manually delete later

---

## After Migration

1. **Application code**: No changes needed
2. **Image URLs**: Automatically updated in database
3. **New uploads**: Will use new ImageUpload component
4. **Old images**: Now use UUID naming

### Your App Automatically Works!

Database records already have new URLs, so:
```javascript
// This still works exactly the same
<img src={product.image_url} alt={product.title} />
// Now loads: img_a1b2c3d4e5f6g7h8.jpg instead of old filename
```

---

## Next Steps

1. ✅ Migrate images: `node migrate-images-to-uuid.js`
2. ✅ Check report: `cat MIGRATION_REPORT.json`
3. ✅ Restart app: `npm run dev`
4. ✅ Test images load
5. ✅ Deploy to production

---

## Document Structure

```
IMAGE_MANAGEMENT_START_HERE.md
  → Overview of image management system

IMAGE_MIGRATION_QUICK_START.md
  → Fast reference (this is the quick version)

IMAGE_MIGRATION_GUIDE.md
  → Complete guide with all details

migrate-images-to-uuid.js
  → The script that does the migration

MIGRATION_REPORT.json
  → Generated report (after you run migration)
```

---

## Getting Help

**Quick question?** → [IMAGE_MIGRATION_QUICK_START.md](IMAGE_MIGRATION_QUICK_START.md)

**Need details?** → [IMAGE_MIGRATION_GUIDE.md](IMAGE_MIGRATION_GUIDE.md)

**Problem?** → Check Troubleshooting section in guide

---

## Success Criteria

After migration:
- ✅ No "Failed" messages in console
- ✅ MIGRATION_REPORT.json shows 0 errors
- ✅ Database shows updated image_url values
- ✅ Application loads all images correctly
- ✅ No 404 errors in browser console

---

## Ready?

```bash
# 1. Set credentials
export SUPABASE_URL="https://..."
export SUPABASE_KEY="..."

# 2. Run migration
node migrate-images-to-uuid.js

# 3. Check report
cat MIGRATION_REPORT.json

# 4. Done! ✅
```

**Estimated time**: 20-50 minutes (depending on image count)

**Risk**: Low (reversible via report)

**Difficulty**: Easy (one command)

---

**Let's migrate!** 🚀
