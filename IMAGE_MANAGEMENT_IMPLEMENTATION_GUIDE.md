# Image Management Implementation Guide

## Overview
Complete image management system with:
- UUID-based filename storage (prevents conflicts)
- URL and file upload support
- Variant image inheritance (variants use main image without duplication)
- Admin flagging for missing variant images
- Placeholder/default image support

## System Architecture

### Components

#### 1. Backend: `server/images.js`
**Purpose**: Handle all image upload/download/deletion operations

**Key Features**:
- UUID-based filename generation (16-char trim)
- File upload from multipart form-data
- URL-based image upload with validation
- Image deletion with validation
- Placeholder image serving
- File size validation (max 10MB)
- MIME type validation (JPEG, PNG, WebP, GIF)

**Endpoints**:
```
POST /api/images/upload
- Body: multipart/form-data with 'image' field and 'bucket' parameter
- Returns: {success, imageUrl, filename}

POST /api/images/upload-from-url
- Body: {imageUrl, bucket}
- Returns: {success, imageUrl, filename}

POST /api/images/validate-url
- Body: {imageUrl}
- Returns: {valid, imageUrl}

DELETE /api/images/:bucket/:filename
- Returns: {success}

GET /api/images/placeholders
- Returns: {product, avatar, vendor}
```

**Storage Buckets**:
- `product-images`: Product and variant images
- `vendor-images`: Vendor profile images
- `user-avatars`: User avatar images

**Filename Format**:
```
img_[16-char-uuid-trim].[extension]
Example: img_a1b2c3d4e5f6g7h8.jpg
```

#### 2. Frontend: `src/components/image/ImageUpload.jsx`
**Purpose**: Reusable React component for image upload UI

**Props**:
```javascript
{
  onImageSelect: Function,     // Called with {url, filename} when image selected
  onError: Function,           // Called with error message
  bucket: String,              // Storage bucket ('product-images', 'vendor-images', 'user-avatars')
  maxSize: Number,             // Max file size in bytes (default 10MB)
  label: String,               // Input label
  description: String,         // Help text
  isOptional: Boolean,         // Show "optional" text
  showPlaceholder: Boolean,    // Show placeholder option
  placeholderUrl: String       // Placeholder image URL
}
```

**Features**:
- Toggle between file upload and URL input
- Drag-drop file upload support
- File validation (size, type)
- URL validation before upload
- Live preview of selected image
- Clear/remove button
- Error messages
- Loading states

#### 3. Frontend: `src/api/imageApi.js`
**Purpose**: API wrapper for image operations

**Functions**:
```javascript
getPlaceholders()                    // Get all placeholder URLs
getPlaceholder(type)                 // Get specific placeholder (product/avatar/vendor)
uploadImageFile(file, bucket)        // Upload file to bucket
uploadImageFromUrl(imageUrl, bucket) // Upload from URL
validateImageUrl(imageUrl)           // Validate URL accessibility
deleteImage(bucket, filename)        // Delete image from bucket
```

#### 4. Frontend: `src/api/productImageApi.js`
**Purpose**: Product/variant-specific image logic

**Key Functions**:
```javascript
getVariantImage(variant, product)                    // Get effective image (variant → product → placeholder)
flagVariantForImageAssistance(variantId, ...)      // Create admin notification for missing image
getProductVariantsWithImages(productId)            // Get all variants with effective images
updateProductImage(productId, imageUrl)            // Update product.image_url
updateVariantImage(variantId, imageUrl)            // Update variant.image_url
getVariantsNeedingImages(limit)                    // Get all variants without images (admin view)
isProductImageComplete(productId)                  // Check if product has image
getVendorImageWarnings(vendorId)                   // Get all missing images for vendor
bulkUpdateProductImages(updates)                   // Batch update multiple images
```

## Integration Points

### 1. Product Creation Flow
**File**: `src/pages/vendor/ProductCreate.jsx` (or similar)

```javascript
import { ImageUpload } from '@/components/image/ImageUpload';
import { updateProductImage } from '@/api/productImageApi';
import { uploadImageFile } from '@/api/imageApi';

// In form:
<ImageUpload
  onImageSelect={async (image) => {
    // Image already uploaded by ImageUpload component
    const result = await updateProductImage(productId, image.url);
  }}
  bucket="product-images"
  label="Product Image"
  description="Main image for your product"
/>
```

### 2. Product Edit Flow
**File**: `src/pages/vendor/ProductEdit.jsx`

```javascript
// Show current image
<img src={product.image_url} alt={product.title} />

// Allow replacement
<ImageUpload
  onImageSelect={async (image) => {
    const result = await updateProductImage(productId, image.url);
    // Refresh product data
  }}
  bucket="product-images"
  label="Update Product Image"
/>
```

### 3. Variant Management
**File**: `src/components/ProductVariants.jsx` (or similar)

```javascript
import { 
  getProductVariantsWithImages, 
  updateVariantImage,
  flagVariantForImageAssistance 
} from '@/api/productImageApi';

// Get variants with effective images
const { product, variants } = await getProductVariantsWithImages(productId);

// Display variant
{variants.map(variant => (
  <div key={variant.id}>
    <img src={variant.image_url} alt={variant.title} />
    
    {!variant.has_own_image && (
      <div className="badge">Using product image</div>
    )}
    
    {variant.needs_image_flag && (
      <ImageUpload
        onImageSelect={async (image) => {
          await updateVariantImage(variant.id, image.url);
        }}
        bucket="product-images"
        label="Add Variant-Specific Image"
        isOptional={true}
      />
    )}
  </div>
))}
```

### 4. Admin Dashboard (Missing Images)
**File**: `src/pages/admin/ImageManagement.jsx`

```javascript
import { getVariantsNeedingImages, getVendorImageWarnings } from '@/api/productImageApi';

// Get variants needing images
const needingImages = await getVariantsNeedingImages(50);

// Show warnings for vendor
const warnings = await getVendorImageWarnings(vendorId);

// Display with bulk update capability
{warnings.variantsWithoutImages.map(variant => (
  <ImageUpload
    onImageSelect={async (image) => {
      await updateVariantImage(variant.id, image.url);
    }}
    bucket="product-images"
  />
))}
```

## Database Schema Requirements

### products table
```sql
ALTER TABLE products ADD COLUMN image_url VARCHAR(255);
```

### product_variants table
```sql
ALTER TABLE product_variants ADD COLUMN image_url VARCHAR(255);
```

### notifications table (for image flagging)
```sql
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  vendor_id UUID REFERENCES vendors,
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50), -- 'variant_image_needed', etc.
  reference_type VARCHAR(50),
  reference_id VARCHAR(255),
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Placeholder Images

### Configuration
Default placeholders use via.placeholder.com:

```javascript
const PLACEHOLDERS = {
  product: 'https://via.placeholder.com/400x400?text=Product+Image',
  avatar: 'https://via.placeholder.com/150x150?text=Avatar',
  vendor: 'https://via.placeholder.com/300x300?text=Vendor'
};
```

### Custom Configuration
To use custom placeholder images:

1. Create placeholder images and upload to Supabase storage
2. Update `server/images.js` PLACEHOLDERS config with URLs
3. Endpoints: `GET /api/images/placeholders` returns all configured placeholders

## Image URL Retrieval

### Format
```javascript
// For direct Supabase storage access
const imageUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${bucket}/${filename}`;

// Example
https://myproject.supabase.co/storage/v1/object/public/product-images/img_a1b2c3d4e5f6g7h8.jpg
```

### In Database
Images are stored in `products.image_url` and `product_variants.image_url` as full URLs.

## UUID Filename Explanation

Why UUID instead of slug?

1. **No Conflicts**: Same product image uploaded multiple times = different filenames
2. **Flexible**: Works across vendors without slug coordination
3. **Simple**: No need for slug generation or validation
4. **Reversible**: Can still query by product_id + image_url

**Example**:
```
UUID: f47ac10b-58cc-4372-a567-0e02b2c3d479
Trim: f47ac10b58cc4372 (16 chars, no hyphens)
File: img_f47ac10b58cc4372.jpg
```

## Error Handling

### Common Errors
```
File too large (>10MB)
→ Handled by ImageUpload component
→ Shows error message to user

Invalid MIME type
→ Rejected by backend
→ Error message: "Unsupported file type"

URL inaccessible
→ Validation endpoint checks before upload
→ Shows specific error: "Image URL not accessible"

Missing variant image
→ Automatically uses product image
→ Flagged via notification for variant-specific upload
→ Admin can see list of variants needing images
```

## Admin Features

### View All Variants Needing Images
```javascript
const needingImages = await getVariantsNeedingImages(50);
// Returns: [{id, title, product_id, products: {title, vendor_id, ...}}, ...]
```

### View Vendor Image Warnings
```javascript
const warnings = await getVendorImageWarnings(vendorId);
// Returns: {
//   productsWithoutImages: [...],
//   variantsWithoutImages: [...],
//   totalWarnings: 5
// }
```

### Bulk Update Images
```javascript
await bulkUpdateProductImages([
  { productId: 'abc', imageUrl: 'https://...' },
  { variantId: 'xyz', imageUrl: 'https://...' }
]);
```

## Testing the System

### Test File Upload
```bash
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "bucket=product-images"
```

### Test URL Upload
```bash
curl -X POST http://localhost:3001/api/images/upload-from-url \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "bucket": "product-images"
  }'
```

### Test Variant Image Logic
```javascript
import { getVariantImage, getProductVariantsWithImages } from '@/api/productImageApi';

// Get variant with inherited image
const img = await getVariantImage(variant, product);
console.log(img); // → product.image_url or placeholder

// Get all variants with their effective images
const { variants } = await getProductVariantsWithImages(productId);
variants.forEach(v => {
  console.log(`${v.title}: ${v.effective_image}`);
  console.log(`Has own image: ${v.has_own_image}`);
  console.log(`Needs flag: ${v.needs_image_flag}`);
});
```

## Security Considerations

1. **File Upload**:
   - Only authenticated users can upload
   - File size and type validated server-side
   - Files stored in Supabase storage (not database)

2. **Deletion**:
   - Only authenticated users can delete
   - Images tied to products for audit trail
   - Soft delete pattern recommended (keep URLs in history)

3. **URL Access**:
   - Supabase storage URLs are public (no auth required to view)
   - If need private images, adjust Supabase bucket policies
   - Variant images inherit from product = no duplicate storage

## Performance Notes

1. **Image Serving**:
   - Supabase CDN caches all images
   - No server processing required
   - Fast global delivery

2. **Variant Display**:
   - Variants use product image URL directly
   - No extra queries or processing
   - Database stores only one URL per variant

3. **Admin Views**:
   - Queries use indexed fields
   - Limit results (50 variants max per query)
   - Pagination available if needed

## Cleanup and Maintenance

### Orphaned Images
Images with no associated products/variants:
```sql
SELECT filename FROM images 
WHERE product_id IS NULL 
AND variant_id IS NULL 
AND created_at < NOW() - INTERVAL '24 hours';
```

### Duplicate Images
Same URL used multiple times (fine - no duplication):
```sql
SELECT image_url, COUNT(*) 
FROM products 
WHERE image_url IS NOT NULL 
GROUP BY image_url 
HAVING COUNT(*) > 1;
```

### Reset to Placeholder
Set missing images to placeholder (optional):
```sql
UPDATE products 
SET image_url = 'https://via.placeholder.com/400x400?text=Product+Image'
WHERE image_url IS NULL;
```

## Summary

Image management system is complete with:
✅ UUID-based filename storage
✅ File and URL upload support
✅ Variant image inheritance
✅ Admin flagging for missing images
✅ Placeholder fallback system
✅ Reusable React components
✅ Complete API wrapper
✅ Product-specific logic

Next steps:
1. Integrate ImageUpload component into product forms
2. Test variant image inheritance logic
3. Set up admin dashboard for missing images
4. Configure placeholder URLs for your branding
