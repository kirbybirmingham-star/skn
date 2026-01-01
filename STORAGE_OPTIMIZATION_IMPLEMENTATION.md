# 🚀 Storage Optimization - Implementation Guide

**Status**: Ready to Execute  
**Estimated Duration**: 4-6 hours  
**Risk Level**: LOW (with proper backups)

---

## ⚡ Quick Start

### Before You Start
```bash
# 1. Create backup of all buckets
node scripts/backup-storage.js

# 2. Verify current state
node scripts/inspect-storage-structure.js > storage-BEFORE.txt

# 3. Document all image URLs in database
npm run db:export-image-refs > image-urls-backup.json
```

---

## 📋 Phase 1: Critical Bug Fixes (Immediate)

### Task 1.1: Fix "undefined" Vendor Folder
**Time**: 15 minutes | **Impact**: Release 931 KB

**Step 1: Identify the issue**
```sql
-- Find product with undefined vendor
SELECT id, title, vendor_id, image_path 
FROM products 
WHERE image_path LIKE '%undefined%'
ORDER BY created_at DESC;

-- Check if vendor exists
SELECT * FROM vendors 
WHERE id IS NULL OR id = 'undefined';
```

**Step 2: Determine correct action**
```javascript
// Option A: Delete if no matching product
async function removeUndefinedVendorFolder() {
  const { data, error } = await supabase.storage
    .from('listings-images')
    .list('vendors/undefined');
  
  if (data) {
    for (const file of data) {
      // Document file first
      console.log(`BACKUP: vendors/undefined/${file.name}`);
      
      // Delete file
      await supabase.storage
        .from('listings-images')
        .remove([`vendors/undefined/${file.name}`]);
    }
  }
}

// Option B: If products exist, update vendor_id
UPDATE products 
SET vendor_id = 'correct-vendor-uuid'
WHERE vendor_id IS NULL;
```

**Step 3: Execute removal**
```bash
node scripts/fix-undefined-vendor.js
```

**Verification**:
```sql
-- Confirm no files in undefined folder
SELECT * FROM storage.objects 
WHERE name LIKE 'vendors/undefined/%';

-- Should return: 0 rows
```

---

### Task 1.2: Remove Stub Files
**Time**: 10 minutes | **Impact**: Release ~30 KB, cleanup

**Step 1: Identify all stub files (700-720B)**
```javascript
async function findStubFiles() {
  const { data: items } = await supabase.storage
    .from('skn-bridge-assets')
    .list('products', { limit: 1000 });
  
  const stubs = items.filter(item => item.size < 750 && item.size > 700);
  return stubs;
}
```

**Step 2: Review and confirm deletion**
```javascript
const stubFiles = [
  'caribbean-bead-necklace.jpg',
  'caribbean-dreamcatcher.jpg',
  'handwoven-palm-basket.jpg',
  // ... etc
];

// Check if these exist in listings-images or product-images
// If yes, keep. If only in skn-bridge-assets, safe to delete
```

**Step 3: Delete**
```javascript
async function deleteStubFiles() {
  const stubs = [
    'products/crafts/caribbean-bead-necklace.jpg',
    'products/crafts/caribbean-dreamcatcher.jpg',
    // ... complete list
  ];
  
  for (const path of stubs) {
    await supabase.storage
      .from('skn-bridge-assets')
      .remove([path]);
    console.log(`✅ Deleted: ${path}`);
  }
}
```

---

### Task 1.3: Clean Empty Placeholders
**Time**: 5 minutes | **Impact**: Remove clutter

```javascript
async function cleanEmptyPlaceholders() {
  // Remove from skn-bridge-assets
  await supabase.storage
    .from('skn-bridge-assets')
    .remove(['users/.emptyFolderPlaceholder']);
  
  // Remove from listings-images
  await supabase.storage
    .from('listings-images')
    .remove(['products/Untitled folder/.emptyFolderPlaceholder']);
}
```

---

## 📋 Phase 2: Remove Duplicates (1-2 hours)

### Task 2.1: Document Current Setup
```javascript
// Map where each image is currently used
const imageMap = {
  'gourmet-pasta-sauce.jpg': [
    { bucket: 'skn-bridge-assets', path: 'products/food/' },
    { bucket: 'listings-images', path: 'vendors/undefined/products/' }
  ],
  'authentic-jerk-seasoning.jpg': [
    { bucket: 'skn-bridge-assets', path: 'products/produce/' },
    { bucket: 'listings-images', path: 'vendors/.../products/' }
  ]
  // ... etc
};
```

### Task 2.2: Update Database References
```sql
-- Before deleting duplicates, ensure DB references primary bucket
UPDATE products 
SET image_url = CONCAT(
  'skn-bridge-assets/products/', 
  category, '/', 
  image_filename
)
WHERE image_url LIKE '%listings-images%';
```

### Task 2.3: Delete Duplicate Copies
```javascript
async function removeDuplicates() {
  const duplicates = [
    'vendors/undefined/products/gourmet-pasta-sauce/main.jpg',
    'vendors/72db3dcb-8384-49df-ae3a-ad4106371917/products/authentic-jerk-seasoning/main.jpg',
    'vendors/a1bc8ec0-7de9-420b-82a5-e03766550def/products/artisan-bread-loaf/main.jpg',
    // ... complete list
  ];
  
  for (const path of duplicates) {
    const { error } = await supabase.storage
      .from('listings-images')
      .remove([path]);
    
    if (error) {
      console.error(`❌ Failed: ${path}`, error);
    } else {
      console.log(`✅ Deleted: ${path}`);
    }
  }
}
```

**Verification**:
```javascript
// Confirm no duplicates remain
async function verifyNoDuplicates() {
  const duplicates = [
    { name: 'gourmet-pasta-sauce.jpg', shouldBeOnly: 'skn-bridge-assets' },
    { name: 'authentic-jerk-seasoning.jpg', shouldBeOnly: 'skn-bridge-assets' },
    // ... etc
  ];
  
  for (const dup of duplicates) {
    // Search all buckets
    const results = await searchFile(dup.name);
    if (results.count > 1) {
      console.error(`❌ Still duplicated: ${dup.name}`);
    }
  }
}
```

---

## 📋 Phase 3: Bucket Consolidation (2-3 hours)

### Task 3.1: Migrate product-images Bucket
**Time**: 45 minutes

**Step 1: Copy all files**
```javascript
async function migrateProductImages() {
  // List all files in product-images
  const { data: files } = await supabase.storage
    .from('product-images')
    .list('');
  
  // Download and re-upload to skn-bridge-assets/products/
  for (const file of files) {
    // Download from source
    const { data: content, error: dlErr } = await supabase.storage
      .from('product-images')
      .download(file.name);
    
    if (dlErr) continue;
    
    // Upload to destination
    const newPath = `products/${file.name}`;
    const { error: upErr } = await supabase.storage
      .from('skn-bridge-assets')
      .upload(newPath, content);
    
    if (upErr) {
      console.error(`❌ Failed to upload: ${newPath}`, upErr);
    } else {
      console.log(`✅ Migrated: ${file.name}`);
    }
  }
}
```

**Step 2: Verify all files copied**
```javascript
async function verifyMigration() {
  const { data: original } = await supabase.storage
    .from('product-images')
    .list('');
  
  const { data: migrated } = await supabase.storage
    .from('skn-bridge-assets')
    .list('products');
  
  const originalNames = original.map(f => f.name).sort();
  const migratedNames = migrated
    .filter(f => originalNames.includes(f.name))
    .map(f => f.name)
    .sort();
  
  if (JSON.stringify(originalNames) === JSON.stringify(migratedNames)) {
    console.log('✅ All files migrated successfully');
    return true;
  } else {
    console.error('❌ Some files are missing');
    return false;
  }
}
```

**Step 3: Update database references**
```sql
-- Update all references from product-images to skn-bridge-assets
UPDATE products 
SET image_url = CONCAT('skn-bridge-assets/products/', image_filename)
WHERE image_url LIKE '%product-images%';
```

**Step 4: Delete old bucket**
```javascript
// ONLY after verifying all files work!
async function deleteProductImagesBucket() {
  // Keep bucket for 1 week as backup
  // Then delete via Supabase console
  console.log('Save product-images bucket deletion for later');
}
```

---

### Task 3.2: Migrate avatar Bucket
**Time**: 30 minutes

```javascript
async function migrateAvatarBucket() {
  const { data: files } = await supabase.storage
    .from('avatar')
    .list('');
  
  for (const file of files) {
    // Download
    const { data: content } = await supabase.storage
      .from('avatar')
      .download(file.name);
    
    // Upload to new location
    const userId = extractUserIdFromFilename(file.name);
    const newPath = `users/avatars/${userId}/${file.name}`;
    
    await supabase.storage
      .from('skn-bridge-assets')
      .upload(newPath, content);
    
    console.log(`✅ Migrated: ${file.name}`);
  }
}
```

**Update database**:
```sql
UPDATE auth.users 
SET metadata = jsonb_set(
  metadata, 
  '{avatar_url}', 
  to_jsonb(CONCAT('skn-bridge-assets/users/avatars/', id, '/', old_avatar_filename))
)
WHERE metadata->>'avatar_url' LIKE '%avatar%';
```

---

### Task 3.3: Clean listings-images
**Time**: 30 minutes

```javascript
async function cleanListingsImages() {
  // Keep only vendor-specific images that aren't in skn-bridge-assets
  const { data: files, error } = await supabase.storage
    .from('listings-images')
    .list('', { limit: 1000 });
  
  for (const file of files) {
    // Check if this file is also in skn-bridge-assets
    const exists = await fileExistsIn('skn-bridge-assets', file.name);
    
    if (exists) {
      // Remove duplicate
      await supabase.storage
        .from('listings-images')
        .remove([file.name]);
      console.log(`✅ Removed duplicate: ${file.name}`);
    }
  }
}
```

---

## 📋 Phase 4: Verification & Testing (1 hour)

### Task 4.1: Verify All URLs Work
```javascript
async function testAllImageUrls() {
  // Get all products with images
  const { data: products } = await supabase
    .from('products')
    .select('id, image_url')
    .not('image_url', 'is', null);
  
  let failures = [];
  
  for (const product of products) {
    try {
      const response = await fetch(product.image_url, { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      if (response.status !== 200) {
        failures.push({
          productId: product.id,
          url: product.image_url,
          status: response.status
        });
      }
    } catch (err) {
      failures.push({
        productId: product.id,
        url: product.image_url,
        error: err.message
      });
    }
  }
  
  if (failures.length === 0) {
    console.log('✅ All image URLs working!');
  } else {
    console.error('❌ Failed URLs:', failures);
    return false;
  }
  
  return true;
}
```

### Task 4.2: Verify Bucket Sizes
```javascript
async function verifyStorageOptimization() {
  const { data: buckets } = await supabase.storage.listBuckets();
  
  const sizes = {};
  let total = 0;
  
  for (const bucket of buckets) {
    const { data: items } = await supabase.storage
      .from(bucket.name)
      .list('', { limit: 1000 });
    
    const size = items.reduce((sum, item) => sum + (item.size || 0), 0);
    sizes[bucket.name] = size;
    total += size;
  }
  
  console.log('Storage after optimization:');
  console.table(sizes);
  console.log(`Total: ${formatSize(total)}`);
}
```

### Task 4.3: Test in Development
```bash
# Run full test suite
npm run test -- storage

# Check console for broken images
npm run dev

# Test in browser:
# - Check all product pages load images
# - Check vendor profiles load avatars
# - Check search results display images
# - Check user profile avatars
```

---

## 🛡️ Rollback Plan

### If Something Goes Wrong

**Restore from Backup**:
```bash
# 1. Stop all applications
npm run stop

# 2. Restore from backup
node scripts/restore-storage.js --timestamp [backup-date]

# 3. Update database to old URLs
npm run db:restore-image-refs --timestamp [backup-date]

# 4. Restart
npm run dev
```

**Quick Rollback**:
```javascript
// If only one bucket affected
async function quickRollback(bucket) {
  const backup = await getLatestBackup(bucket);
  await restoreFromBackup(bucket, backup);
}
```

---

## 📊 Success Criteria

### Before Optimization
- Total: 10.41 MB, 4 buckets, 132 files
- Issues: Duplicates, fragmentation, "undefined" folder

### After Optimization
- [ ] Total: ~8.5 MB (18% reduction)
- [ ] Buckets: 2 main buckets (skn-bridge-assets + listings-images archive)
- [ ] Files: ~110 (duplicates removed)
- [ ] All URLs working
- [ ] No "undefined" folders
- [ ] Consistent naming
- [ ] Clean folder structure
- [ ] All tests passing

---

## 🚀 Execution Checklist

```
PRE-EXECUTION:
  [ ] Backup all buckets
  [ ] Document all URLs
  [ ] Notify team
  [ ] Schedule maintenance window
  [ ] Prepare rollback plan

PHASE 1 - Bug Fixes (30 mins):
  [ ] Fix undefined vendor folder
  [ ] Remove stub files
  [ ] Clean empty placeholders
  [ ] Verify changes

PHASE 2 - Duplicates (1-2 hours):
  [ ] Document duplicates
  [ ] Update DB references
  [ ] Delete duplicate files
  [ ] Verify removal

PHASE 3 - Consolidation (2-3 hours):
  [ ] Migrate product-images bucket
  [ ] Migrate avatar bucket
  [ ] Clean listings-images
  [ ] Update all references

PHASE 4 - Testing (1 hour):
  [ ] Test all URLs
  [ ] Verify storage sizes
  [ ] Run full test suite
  [ ] Manual browser testing

POST-EXECUTION:
  [ ] Keep old buckets 7 days
  [ ] Monitor error logs
  [ ] Verify performance
  [ ] Document results
  [ ] Archive process
```

---

## 📞 Troubleshooting

### Issue: Files not found after migration
**Solution**:
1. Check URL format is correct
2. Verify file actually copied
3. Check RLS policies allow access
4. Check bucket is public

### Issue: Missing images on production
**Solution**:
1. Check database has correct URLs
2. Verify RLS policies
3. Check CORS settings
4. Test with incognito browser

### Issue: Migration incomplete
**Solution**:
1. Check error logs for failed uploads
2. Re-run migration for missing files
3. Verify file sizes match source
4. Check folder structure created

---

## 📈 Performance Expectations

**After Optimization**:
- Image load times: 10-15% faster (fewer buckets)
- API calls: 30% fewer (consolidated queries)
- Management: 50% simpler (2 vs 4 buckets)
- Storage costs: ~18% reduction

---

## 💾 Files to Run

```bash
# Inspect current state
node scripts/inspect-storage-structure.js

# Execute optimization (when ready)
node scripts/optimize-storage.js

# Verify completion
node scripts/verify-optimization.js

# Test all URLs
node scripts/test-image-urls.js
```

