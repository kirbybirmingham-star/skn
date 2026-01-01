# Image Management - Technical Reference

## API Endpoints

### POST /api/images/upload
Upload image file via multipart form-data

**Request**:
```
POST /api/images/upload HTTP/1.1
Authorization: Bearer {auth_token}
Content-Type: multipart/form-data

[Form Data]
image: [File]
bucket: product-images
```

**Response** (Success):
```json
{
  "success": true,
  "imageUrl": "https://project.supabase.co/storage/v1/object/public/product-images/img_a1b2c3d4e5f6g7h8.jpg",
  "filename": "img_a1b2c3d4e5f6g7h8.jpg",
  "bucket": "product-images"
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": "File size exceeds 10MB limit"
}
```

**Validation**:
- File required
- Bucket required (product-images, vendor-images, user-avatars)
- File size max 10MB
- Allowed types: JPEG, PNG, WebP, GIF

---

### POST /api/images/upload-from-url
Upload image from URL

**Request**:
```json
{
  "imageUrl": "https://example.com/product.jpg",
  "bucket": "product-images"
}
```

**Headers**:
```
Authorization: Bearer {auth_token}
Content-Type: application/json
```

**Response** (Success):
```json
{
  "success": true,
  "imageUrl": "https://project.supabase.co/storage/v1/object/public/product-images/img_a1b2c3d4e5f6g7h8.jpg",
  "filename": "img_a1b2c3d4e5f6g7h8.jpg",
  "bucket": "product-images",
  "sourceUrl": "https://example.com/product.jpg"
}
```

**Validation**:
- URL must be accessible and return image
- URL must point to valid image file
- Same file size and type restrictions apply

---

### POST /api/images/validate-url
Validate image URL without uploading

**Request**:
```json
{
  "imageUrl": "https://example.com/product.jpg"
}
```

**Response** (Valid):
```json
{
  "valid": true,
  "imageUrl": "https://example.com/product.jpg",
  "contentType": "image/jpeg",
  "size": 245678
}
```

**Response** (Invalid):
```json
{
  "valid": false,
  "error": "URL is not accessible"
}
```

---

### DELETE /api/images/:bucket/:filename
Delete image from storage

**Request**:
```
DELETE /api/images/product-images/img_a1b2c3d4e5f6g7h8.jpg HTTP/1.1
Authorization: Bearer {auth_token}
```

**Response**:
```json
{
  "success": true,
  "bucket": "product-images",
  "filename": "img_a1b2c3d4e5f6g7h8.jpg"
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": "Image not found"
}
```

---

### GET /api/images/placeholders
Get all configured placeholder URLs

**Request**:
```
GET /api/images/placeholders HTTP/1.1
```

**Response**:
```json
{
  "product": "https://via.placeholder.com/400x400?text=Product+Image",
  "avatar": "https://via.placeholder.com/150x150?text=Avatar",
  "vendor": "https://via.placeholder.com/300x300?text=Vendor"
}
```

---

## Frontend API Functions

### imageApi.getPlaceholders()
Get all placeholder images

```javascript
const placeholders = await getPlaceholders();
// Returns: {product, avatar, vendor}
```

---

### imageApi.getPlaceholder(type)
Get specific placeholder

```javascript
const productPlaceholder = await getPlaceholder('product');
// Returns: "https://via.placeholder.com/400x400?text=Product+Image"
```

**Types**: `product`, `avatar`, `vendor`

---

### imageApi.uploadImageFile(file, bucket)
Upload file to bucket

```javascript
const result = await uploadImageFile(file, 'product-images');
// Returns: {success, imageUrl, filename, bucket}
```

**Parameters**:
- `file` (File): HTML File object
- `bucket` (string): Storage bucket name

---

### imageApi.uploadImageFromUrl(imageUrl, bucket)
Upload image from URL

```javascript
const result = await uploadImageFromUrl('https://...', 'product-images');
// Returns: {success, imageUrl, filename, bucket}
```

---

### imageApi.validateImageUrl(imageUrl)
Validate URL before upload

```javascript
const validation = await validateImageUrl('https://...');
// Returns: {valid, error?, contentType, size}
```

---

### imageApi.deleteImage(bucket, filename)
Delete image from bucket

```javascript
const result = await deleteImage('product-images', 'img_a1b2c3d4e5f6g7h8.jpg');
// Returns: {success, error?}
```

---

## Product Image Functions

### productImageApi.getVariantImage(variant, product)
Get effective image for variant

```javascript
const imageUrl = await getVariantImage(variant, product);
// Returns: variant.image_url || product.image_url || placeholder
```

---

### productImageApi.getProductVariantsWithImages(productId)
Get all variants with effective images

```javascript
const result = await getProductVariantsWithImages('prod-123');
// Returns: {
//   product: {id, image_url},
//   variants: [
//     {
//       id,
//       title,
//       image_url,        // Effective image (variant → product → placeholder)
//       has_own_image,    // Boolean
//       needs_image_flag, // Boolean (variant inheriting from product)
//       product_image     // Product's image_url
//     }
//   ]
// }
```

---

### productImageApi.updateProductImage(productId, imageUrl)
Update product image

```javascript
const result = await updateProductImage('prod-123', 'https://...');
// Returns: {success, product?, error?}
```

---

### productImageApi.updateVariantImage(variantId, imageUrl)
Update variant image

```javascript
const result = await updateVariantImage('var-456', 'https://...');
// Returns: {success, variant?, error?}
// Clears notification if variant previously lacking image
```

---

### productImageApi.flagVariantForImageAssistance(variantId, productId, vendorId)
Create admin notification for missing variant image

```javascript
const success = await flagVariantForImageAssistance('var-456', 'prod-123', 'ven-789');
// Returns: boolean
```

**Creates**:
- Notification entry in database
- Type: `variant_image_needed`
- Marked as unread for vendor

---

### productImageApi.getVariantsNeedingImages(limit)
Get all variants without images (admin function)

```javascript
const variants = await getVariantsNeedingImages(50);
// Returns: [
//   {
//     id,
//     title,
//     attributes,
//     product_id,
//     products: {id, title, vendor_id, image_url, vendors: {business_name}}
//   }
// ]
```

---

### productImageApi.isProductImageComplete(productId)
Check if product has image

```javascript
const hasImage = await isProductImageComplete('prod-123');
// Returns: boolean
```

---

### productImageApi.getVendorImageWarnings(vendorId)
Get all missing images for vendor

```javascript
const warnings = await getVendorImageWarnings('ven-789');
// Returns: {
//   productsWithoutImages: [{id, title}],
//   variantsWithoutImages: [{id, title, product_id, products: {title}}],
//   totalWarnings: 5
// }
```

---

### productImageApi.bulkUpdateProductImages(updates)
Update multiple images at once

```javascript
const result = await bulkUpdateProductImages([
  {productId: 'prod-123', imageUrl: 'https://...'},
  {variantId: 'var-456', imageUrl: 'https://...'}
]);
// Returns: {
//   success,
//   results: [{type, id, success, error?}],
//   successCount,
//   failureCount
// }
```

---

## React Component: ImageUpload

### Props

```typescript
interface ImageUploadProps {
  onImageSelect: (image: {url: string, filename: string}) => void;
  onError?: (error: string) => void;
  bucket?: 'product-images' | 'vendor-images' | 'user-avatars';
  maxSize?: number;           // Bytes (default 10MB)
  label?: string;
  description?: string;
  isOptional?: boolean;
  showPlaceholder?: boolean;
  placeholderUrl?: string;
}
```

### Example Usage

```javascript
<ImageUpload
  onImageSelect={(image) => {
    console.log('Image uploaded:', image.url);
    // Save to database
  }}
  onError={(error) => {
    console.error('Upload failed:', error);
  }}
  bucket="product-images"
  maxSize={10 * 1024 * 1024}
  label="Product Image"
  description="Upload a clear image of your product (JPG, PNG, WebP or GIF)"
  isOptional={false}
  showPlaceholder={true}
  placeholderUrl="https://via.placeholder.com/400x400?text=Product"
/>
```

### Features
- Toggle between file upload and URL input
- Drag-and-drop file upload
- File type and size validation
- Live preview of selected image
- Clear button to remove selection
- Loading state during upload
- Error messages
- Optional image with help text

---

## Database Schema

### products table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  image_url VARCHAR(255),     -- NEW: Full URL to image
  vendor_id UUID REFERENCES vendors(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### product_variants table
```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  title VARCHAR(255) NOT NULL,
  attributes JSONB,
  image_url VARCHAR(255),     -- NEW: Optional variant-specific image
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### notifications table
```sql
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  vendor_id UUID REFERENCES vendors(id),
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50),           -- 'variant_image_needed', etc.
  reference_type VARCHAR(50), -- 'variant', 'product', etc.
  reference_id VARCHAR(255),  -- ID of the related record
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Error Handling

### Common Errors and Solutions

**Error**: "File size exceeds 10MB limit"
```javascript
// Solution: Compress image or split upload
// Max size: 10MB (10485760 bytes)
```

**Error**: "Unsupported file type"
```javascript
// Solution: Use JPEG, PNG, WebP, or GIF
// Supported: image/jpeg, image/png, image/webp, image/gif
```

**Error**: "Image URL not accessible"
```javascript
// Solution: Check URL is public and image exists
// Note: URL must return valid image content
```

**Error**: "Authentication required"
```javascript
// Solution: Include valid JWT token in Authorization header
// Format: Authorization: Bearer {token}
```

**Error**: "Bucket not found"
```javascript
// Solution: Use valid bucket:
// - product-images
// - vendor-images
// - user-avatars
```

---

## Image URL Format

### Supabase CDN URL
```
https://[PROJECT-ID].supabase.co/storage/v1/object/public/[BUCKET]/[FILENAME]
```

### Example
```
https://myproject.supabase.co/storage/v1/object/public/product-images/img_a1b2c3d4e5f6g7h8.jpg
```

### Usage in Database
Store full URL in `image_url` column:
```sql
UPDATE products 
SET image_url = 'https://myproject.supabase.co/storage/v1/object/public/product-images/img_a1b2c3d4e5f6g7h8.jpg'
WHERE id = 'prod-123';
```

### Usage in React
Display directly in img tag:
```javascript
<img src={product.image_url} alt={product.title} />
```

---

## Filename Generation

### Algorithm
```javascript
function generateImageFilename(originalFilename = '') {
  const uuid = uuidv4();                          // Generate UUID
  const ext = originalFilename?.split('.').pop() || 'jpg';  // Get extension
  const trimmed = uuid.replace(/-/g, '').substring(0, 16);  // 16-char trim
  return `img_${trimmed}.${ext}`;                 // Format
}
```

### Examples
```
Input: photo.jpg
UUID: f47ac10b-58cc-4372-a567-0e02b2c3d479
Output: img_f47ac10b58cc4372.jpg

Input: image.png
UUID: a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6
Output: img_a1b2c3d4e5f647g8.png
```

### Benefits
- ✅ Unique per upload
- ✅ No slug coordination needed
- ✅ Filename conflicts impossible
- ✅ Works across vendors
- ✅ Supports all file types

---

## Performance Optimization

### Image Compression
Use WebP format for 25-35% smaller files:
```
JPEG: 245KB
PNG: 340KB
WebP: 165KB (30% smaller)
```

### CDN Caching
All images cached globally:
```
First request: Full Supabase request
Subsequent requests: CDN cache (instant)
Cache TTL: 31536000 seconds (1 year)
```

### Database Queries
Optimize variant queries:
```javascript
// ✅ Good: Single query with join
const result = await getProductVariantsWithImages(productId);
// Returns all variants with effective images

// ❌ Bad: Query per variant
variants.forEach(v => {
  await getVariantImage(v, product);  // Inefficient
});
```

---

## Security Best Practices

1. **Always validate files server-side**
   - Check file size
   - Check MIME type
   - Verify file content

2. **Require authentication for mutations**
   - All POST/DELETE require JWT token
   - GET endpoints public for CDN

3. **Implement proper authorization**
   - Users can only upload to their own products
   - Vendors can only manage their images
   - Admins can manage all images

4. **Use signed URLs for sensitive files** (if needed)
   - Supabase supports expiring URLs
   - Configure bucket policies for private storage

---

## Debugging

### Check Upload Handler
```bash
# Test file upload
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test.jpg" \
  -F "bucket=product-images"
```

### Check Variant Logic
```javascript
// Get effective image for variant
const img = await getVariantImage(variant, product);
console.log('Effective image:', img);

// Check inheritance
const {variants} = await getProductVariantsWithImages(productId);
variants.forEach(v => {
  console.log(`${v.title}:`);
  console.log(`  - Has own image: ${v.has_own_image}`);
  console.log(`  - Displays: ${v.image_url}`);
  console.log(`  - Inheriting: ${!v.has_own_image}`);
});
```

### Check Admin Functions
```javascript
// Find variants needing images
const needing = await getVariantsNeedingImages(50);
console.log(`Variants needing images: ${needing.length}`);

// Get vendor warnings
const warnings = await getVendorImageWarnings(vendorId);
console.log('Products without images:', warnings.productsWithoutImages.length);
console.log('Variants without images:', warnings.variantsWithoutImages.length);
```

---

## Support & Troubleshooting

**Upload fails with 401 error**
→ Check JWT token is valid and sent in Authorization header

**Upload fails with 400 error**
→ Check file size, type, and bucket parameters

**Images not displaying**
→ Check image_url column has full URL (not just filename)
→ Verify Supabase storage bucket is public

**Variant showing wrong image**
→ Check product.image_url and variant.image_url in database
→ Use getProductVariantsWithImages() to debug

**Placeholder not showing**
→ Check placeholder URL is accessible
→ Verify getPlaceholder() returns correct URL

---

## Summary

**Components**:
- ✅ Backend: Handles uploads, deletion, validation
- ✅ Frontend: React component with upload UI
- ✅ API Wrapper: JavaScript functions for all operations
- ✅ Product Logic: Variant inheritance and admin flagging

**Key Features**:
- ✅ UUID-based filenames (no conflicts)
- ✅ Variant image inheritance (efficient storage)
- ✅ Admin flagging (find missing images)
- ✅ Placeholder fallback (never null image)
- ✅ Multiple buckets (products, vendors, avatars)

**Status**: Production-ready, fully tested, comprehensive documentation
