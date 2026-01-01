# Image Migration - Quick Start

## TL;DR - Run in 3 Steps

### Step 1: Set Environment Variables
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-service-role-key"
```

### Step 2: Run Migration
```bash
node migrate-images-to-uuid.js
```

### Step 3: Check Report
```bash
cat MIGRATION_REPORT.json
```

---

## What Gets Migrated

| Bucket | Files | Naming |
|--------|-------|--------|
| product-images | All product & variant images | img_[16-char-uuid].[ext] |
| vendor-images | All vendor logos | img_[16-char-uuid].[ext] |
| user-avatars | All user avatars | img_[16-char-uuid].[ext] |

**Database Updates**:
- ✅ products.image_url
- ✅ product_variants.image_url
- ✅ vendors.image_url
- ✅ users.avatar_url (if exists)

---

## Example Output

```
🚀 Starting Image Migration to UUID-Based Structure

Step 1: Migrating Image Storage

📦 Migrating bucket: product-images
   ✅ product-1.jpg → img_a1b2c3d4e5f6g7h8.jpg
   ✅ product-2.jpg → img_f9g0h1i2j3k4l5m6.jpg
   ...

Step 2: Updating Database Records

🗄️  Updating product images in database...
   ✅ Product a1b2c3d4... updated
   ✅ Product f9g0h1i2... updated

==========================================================
📊 MIGRATION REPORT
==========================================================

📈 Summary:
   Start Time: 2024-12-31T10:00:00.000Z
   Duration: 330 seconds

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

✅ SUCCESS

📄 Detailed report saved to: MIGRATION_REPORT.json
```

---

## Getting Credentials

**Find your credentials**:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Settings → API
4. Copy:
   - **Project URL** → SUPABASE_URL
   - **Service Role Key** → SUPABASE_KEY (use service role, not anon)

⚠️ **Important**: Use `Service Role Key`, not `Anon Key`

---

## What the Migration Report Shows

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
          "oldFilename": "product-1.jpg",
          "newFilename": "img_a1b2c3d4e5f6g7h8.jpg",
          "newUrl": "https://project.supabase.co/storage/..."
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

## Verify Migration Worked

```javascript
// In your app or browser console
const { data } = await supabase
  .from('products')
  .select('image_url')
  .limit(1);

console.log(data[0].image_url);
// Should be: img_a1b2c3d4e5f6g7h8.jpg pattern
```

---

## If Something Goes Wrong

**Check the errors**:
```bash
# View any errors in report
cat MIGRATION_REPORT.json | grep errors
```

**Common issues**:
- ❌ "SUPABASE_URL environment variable required"
  → Run: `export SUPABASE_URL="..."`

- ❌ "Failed to list files in bucket"
  → Check: Bucket exists, credentials correct

- ❌ "Failed to update products"
  → Check: Table exists, column exists

**Rollback**:
If anything went wrong, you can:
1. Keep old files in storage
2. Revert database from backup
3. Restart application

---

## Performance

| Image Count | Time |
|-------------|------|
| 10 | ~30 seconds |
| 50 | ~2 minutes |
| 100 | ~5 minutes |
| 500 | ~20 minutes |
| 1000 | ~40 minutes |

(Depends on network speed and file sizes)

---

## Next Steps After Migration

1. ✅ Run migration
2. ✅ Check MIGRATION_REPORT.json
3. ✅ Restart your application
4. ✅ Test images load in browser
5. ✅ Deploy to production

---

## Files Involved

- **migrate-images-to-uuid.js** - The migration script (you run this)
- **MIGRATION_REPORT.json** - Generated after running (check this)
- **IMAGE_MIGRATION_GUIDE.md** - Full guide with details

---

## Example: Running in Windows PowerShell

```powershell
# Set environment variables
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_KEY="your-service-role-key"

# Run migration
node migrate-images-to-uuid.js

# Check report
Get-Content MIGRATION_REPORT.json | ConvertFrom-Json | ConvertTo-Json
```

---

## Need Help?

See detailed guide:
→ [IMAGE_MIGRATION_GUIDE.md](IMAGE_MIGRATION_GUIDE.md)

---

**Ready?** Run:
```bash
node migrate-images-to-uuid.js
```

Migration takes 5-40 minutes depending on image count.

**Done!** Check MIGRATION_REPORT.json ✅
