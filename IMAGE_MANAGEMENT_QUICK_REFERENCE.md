# Image Management - Quick Reference Card

## In 60 Seconds

**What it does**: Complete image management with file/URL upload, UUID-based storage, variant inheritance, admin flagging

**Key files**:
- `server/images.js` - Backend
- `src/components/image/ImageUpload.jsx` - React component
- `src/api/imageApi.js` - API wrapper
- `src/api/productImageApi.js` - Product logic

## Frontend Usage

### 1. Upload Component
```javascript
import { ImageUpload } from '@/components/image/ImageUpload';

<ImageUpload
  onImageSelect={(image) => {
    // image.url is ready to save
    await updateProductImage(productId, image.url);
  }}
  bucket="product-images"
  label="Product Image"
/>
```

### 2. Get Variant Image
```javascript
import { getVariantImage, getProductVariantsWithImages } from '@/api/productImageApi';

// Single variant
const img = await getVariantImage(variant, product);
// Returns: variant.image_url || product.image_url || placeholder

// All variants
const {variants} = await getProductVariantsWithImages(productId);
// Each variant has: image_url, has_own_image, needs_image_flag
```

### 3. Update Images
```javascript
import { updateProductImage, updateVariantImage } from '@/api/productImageApi';

// Update product image
await updateProductImage(productId, imageUrl);

// Update variant image
await updateVariantImage(variantId, imageUrl);
```

## Backend Endpoints

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| POST | `/api/images/upload` | `image` file, `bucket` | Required |
| POST | `/api/images/upload-from-url` | `imageUrl`, `bucket` | Required |
| POST | `/api/images/validate-url` | `imageUrl` | Optional |
| DELETE | `/api/images/:bucket/:filename` | — | Required |
| GET | `/api/images/placeholders` | — | Optional |

## Filename Format

```
img_[16-char-uuid-trim].[extension]
Example: img_a1b2c3d4e5f6g7h8.jpg
```

Benefits:
- ✅ Unique per upload
- ✅ No slug conflicts
- ✅ Works across vendors

## Variant Image Logic

```
Variant has image?
  YES → Display variant.image_url
  NO → Product has image?
    YES → Display product.image_url (badge: "Using product image")
    NO → Display placeholder
```

## Common Tasks

### Show Product Image
```javascript
<img src={product.image_url || placeholder} alt={product.title} />
```

### Show Variant Image (with inheritance)
```javascript
const {variants} = await getProductVariantsWithImages(productId);

{variants.map(v => (
  <div>
    <img src={v.image_url} alt={v.title} />
    {!v.has_own_image && <span>Using product image</span>}
  </div>
))}
```

### Upload Product Image
```javascript
const result = await uploadImageFile(file, 'product-images');
await updateProductImage(productId, result.imageUrl);
```

### Upload Variant Image
```javascript
const result = await uploadImageFile(file, 'product-images');
await updateVariantImage(variantId, result.imageUrl);
```

### Find Missing Images (Admin)
```javascript
const variants = await getVariantsNeedingImages(50);
// Lists all variants without images

const warnings = await getVendorImageWarnings(vendorId);
// {productsWithoutImages, variantsWithoutImages, totalWarnings}
```

## Storage Buckets

| Bucket | Use | Path Format |
|--------|-----|------------|
| `product-images` | Product & variant images | `img_*.{jpg,png,webp,gif}` |
| `vendor-images` | Vendor profile images | `img_*.{jpg,png,webp,gif}` |
| `user-avatars` | User profile images | `img_*.{jpg,png,webp,gif}` |

## Error Handling

```javascript
try {
  const result = await uploadImageFile(file, bucket);
  if (!result.success) {
    console.error('Upload failed:', result.error);
    // File too large? Unsupported type? URL inaccessible?
  }
} catch (err) {
  console.error('Network error:', err);
}
```

## Props for ImageUpload

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `onImageSelect` | Function | Required | Called with {url, filename} |
| `onError` | Function | Optional | Called with error message |
| `bucket` | String | Required | Storage bucket name |
| `maxSize` | Number | 10MB | Max file size in bytes |
| `label` | String | "Image" | Input label |
| `description` | String | "" | Help text |
| `isOptional` | Boolean | false | Show "optional" text |
| `showPlaceholder` | Boolean | false | Show placeholder option |
| `placeholderUrl` | String | Default | Placeholder image URL |

## Database Schema

```sql
-- Products table
ALTER TABLE products ADD COLUMN image_url VARCHAR(255);

-- Variants table
ALTER TABLE product_variants ADD COLUMN image_url VARCHAR(255);
```

Images stored as **full URLs** (not filenames):
```
https://project.supabase.co/storage/v1/object/public/product-images/img_a1b2c3d4e5f6g7h8.jpg
```

## Placeholders

Get all:
```javascript
const placeholders = await getPlaceholders();
// {product, avatar, vendor}
```

Get specific:
```javascript
const productPlaceholder = await getPlaceholder('product');
```

Default URLs:
```
Product: https://via.placeholder.com/400x400?text=Product+Image
Avatar: https://via.placeholder.com/150x150?text=Avatar
Vendor: https://via.placeholder.com/300x300?text=Vendor
```

## Testing

### Test Upload
```bash
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@image.jpg" \
  -F "bucket=product-images"
```

### Test URL Upload
```bash
curl -X POST http://localhost:3001/api/images/upload-from-url \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://...","bucket":"product-images"}'
```

## Best Practices

✅ Always use `getProductVariantsWithImages()` for variant display
✅ Store full URL in database (not just filename)
✅ Handle image errors gracefully
✅ Use WebP format for better compression
✅ Lazy load images in product lists
✅ Flag variants for admin assistance if lacking images
✅ Show "Using product image" badge when inherited

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 error | Check JWT token and Authorization header |
| 413 error | File too large (max 10MB) |
| 415 error | Unsupported file type (use JPEG, PNG, WebP, GIF) |
| Image not displaying | Check image_url has full URL, not filename |
| Variant showing wrong image | Run `getProductVariantsWithImages()` to debug |
| URL upload fails | Check URL is public and accessible |

## Quick Links

- **Implementation Guide**: `IMAGE_MANAGEMENT_IMPLEMENTATION_GUIDE.md`
- **Code Examples**: `PRODUCT_IMAGE_INTEGRATION_EXAMPLES.md`
- **Technical Reference**: `IMAGE_MANAGEMENT_TECHNICAL_REFERENCE.md`
- **Deployment Checklist**: `IMAGE_MANAGEMENT_DEPLOYMENT_CHECKLIST.md`
- **Complete Summary**: `IMAGE_MANAGEMENT_COMPLETE_SUMMARY.md`

## File Locations

```
server/images.js                              ← Backend handler
src/api/imageApi.js                           ← API wrapper
src/api/productImageApi.js                    ← Product logic
src/components/image/ImageUpload.jsx          ← React component
```

## Common Code Patterns

### Product Creation with Image
```javascript
const result = await createProduct({title, price, ...});
if (selectedImage) {
  await updateProductImage(result.product.id, selectedImage.url);
}
```

### Product Edit with Image
```javascript
await updateProductImage(productId, newImageUrl);
```

### Display Variant with Inheritance
```javascript
<img src={variant.image_url} alt={variant.title} />
{!variant.has_own_image && <div>Using product image</div>}
```

### Admin: Find Missing Images
```javascript
const list = await getVariantsNeedingImages(50);
// Show list with upload buttons
```

## Performance Notes

- 🚀 Images served via Supabase CDN (global caching)
- 📦 WebP format 30% smaller than JPEG
- 💾 Variants inherit product image (no duplication)
- ⚡ Full URLs stored (no server processing needed)
- 🔍 Indexed queries for admin functions

## Support

1. Check documentation files first
2. Review `PRODUCT_IMAGE_INTEGRATION_EXAMPLES.md` for code examples
3. Check `IMAGE_MANAGEMENT_TECHNICAL_REFERENCE.md` for detailed API docs
4. Review error handling in technical reference

---

**Status**: Production-ready ✅

**Version**: 1.0.0

**Last Updated**: Today
