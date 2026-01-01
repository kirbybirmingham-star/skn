# Category Foreign Key Fix - Test Guide

## What Was Fixed
The product update form was failing with a 400 Bad Request error because it was trying to send a `category` field to the database, but the products table doesn't have a `category` column. Instead, products use a **`category_id` foreign key** to reference a separate `categories` table.

## Solution Implemented

### 1. Created `getOrCreateCategoryByName(categoryName)` Function
**Location:** [src/api/EcommerceApi.jsx](src/api/EcommerceApi.jsx#L815)

This function:
- Takes a category name string (e.g., "Uncategorized", "Produce")
- Queries the `categories` table to find an existing category with that name
- If found: Returns the category ID
- If not found: Creates a new category with auto-generated slug and returns the new ID
- Includes error handling for database failures

```javascript
export async function getOrCreateCategoryByName(categoryName) {
  // 1. Look up category by name in categories table
  // 2. If found, return existing ID
  // 3. If not found, create new category
  // 4. Return ID or null if error
}
```

### 2. Integrated into `updateProduct()` Function
**Location:** [src/api/EcommerceApi.jsx](src/api/EcommerceApi.jsx#L1008)

When updating a product with a category:
```javascript
// Handle category - look up category ID from categories table
if (updates.category !== undefined && updates.category !== null) {
  const categoryId = await getOrCreateCategoryByName(updates.category);
  if (categoryId) {
    dbUpdates.category_id = categoryId;  // ← Set the FK, not the string
    console.log(`📋 Setting category_id to: ${categoryId}`);
  } else {
    console.warn(`⚠️  Could not resolve category "${updates.category}", skipping category update`);
  }
}
```

## Test Procedure

### Test 1: Update Product with Existing Category

**Steps:**
1. Navigate to vendor dashboard → Products
2. Click edit on any product
3. Change the category to "Organic" (or any existing category)
4. Click Save
5. Check console for logs

**Expected Results:**
```
✅ Update successful
📋 Setting category_id to: <uuid>
```

**Verify:**
- No 400 error
- Toast shows "Product updated successfully"
- Product list shows updated category

### Test 2: Update Product with New Category

**Steps:**
1. Navigate to vendor dashboard → Products
2. Click edit on any product
3. Change the category to a NEW category name (e.g., "Exotic Fruits")
4. Click Save
5. Check console for logs

**Expected Results:**
```
✨ Created new category: Exotic Fruits (id: <uuid>)
📋 Setting category_id to: <uuid>
✅ Update successful
```

**Verify:**
- Category is created and assigned
- New category appears in category dropdown on other products
- No 400 error

### Test 3: Monitor with Debug Console

**Steps:**
1. Navigate to `/admin` (Admin Dashboard)
2. Scroll to **Database Debug Console** at bottom
3. Update a product from the vendor dashboard
4. Watch the console in real-time

**Expected Results:**
- UPDATE operation logged with category_id in payload
- Operation shows as successful (green checkmark)
- Expand operation to see category_id value

**Example Log:**
```
[UPDATE] products table
  Status: ✅ Success
  Operation took 1.2s
  
Payload:
  category_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  title: 'Organic Honey'
  base_price: 1250
  ...
```

### Test 4: Verify Category FK Integrity

**Database Check:**
```sql
-- Check that category_id references valid category
SELECT p.id, p.title, p.category_id, c.name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.category_id IS NOT NULL
LIMIT 10;
```

Expected: All category_ids should have matching entries in categories table.

## Debugging If Issues Occur

### Issue: Still Getting 400 Error

**Possible Causes:**
1. **getOrCreateCategoryByName() not being called**
   - Check console: Look for `📋 Setting category_id` logs
   - If missing: Check that HMR reloaded the changes

2. **Category lookup failing silently**
   - Check console: Look for `⚠️  Could not resolve category` warnings
   - Try updating without changing category (should work for other fields)

3. **Database RLS blocking category creation**
   - Check admin console logs for permission errors
   - Verify user has INSERT permission on categories table

### Issue: Product Updates Work but Category Not Saved

1. Check category_id is in the payload: `console.log('🔧 Final dbUpdates to send:', dbUpdates);`
2. Verify categories table has matching ID
3. Check RLS policies on categories table

### Debug Commands

```javascript
// In browser console, run:

// 1. Check if function exists
typeof window.__api?.getOrCreateCategoryByName

// 2. Manually test category lookup
import { getOrCreateCategoryByName } from './src/api/EcommerceApi.jsx'
const catId = await getOrCreateCategoryByName('Test Category')
console.log('Category ID:', catId)
```

## Schema Reference

### products table structure
```
- id (UUID)
- title (text)
- description (text)
- base_price (numeric) ← Maps from form's price_in_cents
- image_url (text) ← Maps from form's image
- category_id (UUID) ← Foreign key to categories.id
- vendor_id (UUID)
- metadata (JSONB) ← For extensible attributes
- created_at, updated_at (timestamps)
```

### categories table structure
```
- id (UUID)
- name (text) ← What we look up/create
- slug (text) ← Auto-generated from name
- created_at, updated_at (timestamps)
```

## Field Mapping Reference

**Form Field → Database Column:**
- `title` → `products.title` ✅
- `description` → `products.description` ✅
- `price_in_cents` → `products.base_price` ✅
- `image` → `products.image_url` ✅
- `category` (string) → `products.category_id` (UUID via FK) ✅ FIXED
- `variants` → `product_variants` table (separate) ✅

## Success Indicators

✅ **All Fixed When:**
1. Product edit form saves without 400 error
2. Console shows: `📋 Setting category_id to: <uuid>`
3. Category is correctly saved in database
4. Product list reflects category changes
5. New categories can be created on-the-fly
6. Debug console shows successful UPDATE operations

---

**Status:** Category FK integration complete. Ready for testing.  
**File Modified:** [src/api/EcommerceApi.jsx](src/api/EcommerceApi.jsx)  
**Functions Added:** `getOrCreateCategoryByName()`  
**Functions Updated:** `updateProduct()`
