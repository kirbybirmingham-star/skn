# Product Creation & Image Upload Fixes

**Date:** December 16, 2025  
**Status:** ✅ Complete

## Overview
Fixed critical issues with product creation and image upload functionality in the vendor dashboard.

## Issues Fixed

### 1. **createProduct Function - Wrong Fields Mapping**
**File:** `src/api/EcommerceApi.jsx`

**Problem:**
- Function was using incorrect field names (`category` instead of storing in metadata)
- Not properly handling variants data structure
- Missing slug generation
- Image upload flow was incomplete

**Solution:**
- Generated slug from product title automatically
- Properly structured product payload for `products` table:
  - `vendor_id` → vendor UUID
  - `base_price` → from `price_in_cents`
  - `image_url` → from product image
  - `metadata.category` → category stored in JSON metadata
  - `is_published` → default true
- Added variant creation logic after product creation
- Returns complete product with variants

**Code Changes:**
```javascript
// Before - incorrect
const payload = {
  vendor_id: vendorId,
  title: productData.title,
  category: productData.category,  // ❌ Wrong field
  image_url: productData.image,
  variants: productData.variants    // ❌ Can't store array directly
};

// After - correct
const payload = {
  vendor_id: vendorId,
  title: productData.title,
  description: productData.description,
  slug: slug,  // ✅ Generated from title
  base_price: productData.price_in_cents,  // ✅ Correct field
  image_url: productData.image || null,
  is_published: true,
  metadata: {
    category: productData.category  // ✅ Stored in metadata
  },
  created_at: new Date().toISOString()
};

// Then create variants in separate insert
if (productData.variants && Array.isArray(productData.variants)) {
  const variantsData = productData.variants.map((v, idx) => ({
    product_id: product.id,
    seller_id: vendorId,
    sku: v.sku || `${slug}-v${idx + 1}`,
    price_in_cents: v.price_in_cents,
    inventory_quantity: v.inventory_quantity || 0,
    attributes: v.attributes || { title: v.title }
  }));
  
  await supabase.from('product_variants').insert(variantsData);
}
```

### 2. **ProductImageManager - Vendor-Organized Storage**
**File:** `src/components/products/ProductImageManager.jsx`

**Problem:**
- Using flat storage paths without vendor organization
- Not integrating with vendor-organized storage system
- Missing vendor context for image paths

**Solution:**
- Integrated with `storageManager.js` functions for vendor-organized paths
- Updated to use `uploadProductGalleryImage` and `deleteProductImage`
- Added `vendorId` prop requirement
- Images now stored at: `listings-images/vendors/{vendorId}/products/{productSlug}/gallery/{index}.jpg`

**Code Changes:**
```javascript
// Before - flat structure
const fileName = `${productSlug}-${Date.now()}-${file.name}`;
const url = await uploadImage(file, fileName, 'listings-images');

// After - vendor-organized
const buffer = await file.arrayBuffer();
const result = await uploadProductGalleryImage(
  supabase,
  vendorId,        // ✅ Now required
  productSlug,
  imageIndex,
  buffer,
  file.type
);
const url = result.publicUrl;

// Delete also updated to extract path from URL
const pathMatch = imageUrl.match(/\/listings-images\/(.*)/);
const path = pathMatch[1];
await deleteProductImage(supabase, path);
```

### 3. **Vendor Products Page - Image Upload Integration**
**File:** `src/pages/vendor/Products.jsx`

**Problem:**
- Missing import for `uploadImageFile`
- Image upload field had no file type acceptance
- No preview of uploaded images
- Dialog was disconnected from image manager

**Solution:**
- Added `uploadImageFile` import from EcommerceApi
- Added `accept="image/*"` attribute to file input
- Added image preview after upload
- Enhanced form to show uploaded image thumbnail

**Code Changes:**
```javascript
// Before
import { getVendorByOwner, ..., formatCurrency } from '@/api/EcommerceApi';
<input type="file" className="w-full mt-2" onChange={...} />

// After
import { getVendorByOwner, ..., formatCurrency, uploadImageFile } from '@/api/EcommerceApi';
<input type="file" accept="image/*" className="w-full mt-2" onChange={...} />
{editingId && form.image && (
  <div className="mt-2">
    <img src={form.image} alt="Product preview" className="w-32 h-32 object-cover rounded" />
  </div>
)}
```

## Testing Checklist

- [ ] **Product Creation Flow**
  - [ ] Navigate to `/dashboard/vendor`
  - [ ] Click "Create Product"
  - [ ] Fill in title, description, price, category
  - [ ] Click "Create"
  - [ ] Verify product appears in list
  - [ ] Check database: product has correct `vendor_id`, `base_price`, and `slug`

- [ ] **Image Upload**
  - [ ] Upload image during product creation
  - [ ] Verify image appears as preview
  - [ ] Check Supabase storage: image in `listings-images/vendors/{vendorId}/products/{slug}/`
  - [ ] Verify `image_url` field populated correctly

- [ ] **Variants**
  - [ ] Create product with multiple variants
  - [ ] Verify variants created in `product_variants` table
  - [ ] Check variant prices match input

- [ ] **Gallery Images** (if using ProductImageManager)
  - [ ] Add multiple gallery images
  - [ ] Verify stored with index: `gallery/0.jpg`, `gallery/1.jpg`, etc.
  - [ ] Delete image and verify removal from storage

## Database Schema Requirements

Ensure these tables exist with correct columns:

### `products` table
```sql
- id (uuid) PRIMARY KEY
- vendor_id (uuid) FOREIGN KEY
- title (text)
- slug (text)
- description (text)
- base_price (numeric/integer) - in cents
- image_url (text)
- is_published (boolean)
- metadata (jsonb) - contains category
- created_at (timestamp)
```

### `product_variants` table
```sql
- id (uuid) PRIMARY KEY
- product_id (uuid) FOREIGN KEY
- seller_id (uuid) FOREIGN KEY  
- sku (text)
- price_in_cents (numeric/integer)
- inventory_quantity (integer)
- attributes (jsonb) - contains title
- is_active (boolean)
```

## Storage Structure

Images are organized by vendor and product:

```
listings-images/
├── vendors/
│   ├── {vendor-id}/
│   │   └── products/
│   │       ├── {product-slug}/
│   │       │   ├── main.jpg (main image)
│   │       │   ├── thumbnails/thumb.jpg
│   │       │   └── gallery/
│   │       │       ├── 0.jpg
│   │       │       ├── 1.jpg
│   │       │       └── ...
```

## Related Files Modified

1. ✅ `src/api/EcommerceApi.jsx` - createProduct function
2. ✅ `src/components/products/ProductImageManager.jsx` - vendor-organized storage
3. ✅ `src/pages/vendor/Products.jsx` - image upload integration
4. ✓ `src/lib/storageManager.js` - already has vendor-organized paths
5. ✓ `src/lib/storagePathBuilder.js` - already has path builders

## Future Improvements

1. Add image resizing/optimization before upload
2. Add drag-and-drop for gallery images
3. Add image cropping/editing UI
4. Add progress indicators for large uploads
5. Add multi-image batch upload with progress
6. Add image URL validation and preview
7. Add automatic thumbnail generation

## Rollback

If issues arise:
```bash
git diff src/api/EcommerceApi.jsx
git diff src/components/products/ProductImageManager.jsx
git diff src/pages/vendor/Products.jsx
```

Then revert specific changes as needed.

---

**Status:** Ready for testing
