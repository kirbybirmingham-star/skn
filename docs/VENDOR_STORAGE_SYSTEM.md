# Vendor-Organized Storage System

## Overview

The new storage system organizes product images by vendor, making it easy to manage, list, and access vendor-specific content.

### Storage Structure

```
listings-images/
└── vendors/
    ├── {vendor_id_1}/
    │   └── products/
    │       ├── {product_slug_1}/
    │       │   ├── main.jpg              (Product main image)
    │       │   ├── thumbnails/
    │       │   │   └── thumb.jpg         (Product thumbnail)
    │       │   └── gallery/
    │       │       ├── 1.jpg             (Gallery image 1)
    │       │       ├── 2.jpg             (Gallery image 2)
    │       │       └── 3.jpg             (Gallery image 3)
    │       └── {product_slug_2}/
    │           └── ...
    └── {vendor_id_2}/
        └── products/
            └── ...
```

### Public URLs

Images are accessible via public URLs:

```
https://your-project.supabase.co/storage/v1/object/public/listings-images/vendors/{vendor_id}/products/{product_slug}/main.jpg
https://your-project.supabase.co/storage/v1/object/public/listings-images/vendors/{vendor_id}/products/{product_slug}/thumbnails/thumb.jpg
https://your-project.supabase.co/storage/v1/object/public/listings-images/vendors/{vendor_id}/products/{product_slug}/gallery/1.jpg
```

---

## Utilities & Libraries

### 1. `src/lib/storagePathBuilder.js`

Constructs storage paths and URLs for vendor-organized images.

**Functions:**

```javascript
import {
  getProductMainImagePath,        // vendors/{id}/products/{slug}/main.jpg
  getProductThumbnailPath,        // vendors/{id}/products/{slug}/thumbnails/thumb.jpg
  getProductGalleryImagePath,     // vendors/{id}/products/{slug}/gallery/{n}.jpg
  getVendorProductsDirectory,     // vendors/{id}/products
  getProductDirectory,            // vendors/{id}/products/{slug}
  parseStoragePath,               // Extract vendor_id & product_slug from path
  getPublicUrl                    // Generate public URL
} from '@/lib/storagePathBuilder';
```

**Examples:**

```javascript
// Get path for product main image
const path = getProductMainImagePath(
  'a7b8c9d0-e1f2-3456-7890-bcdef0123456',
  'wireless-mouse'
);
// Returns: 'vendors/a7b8c9d0-e1f2-3456-7890-bcdef0123456/products/wireless-mouse/main.jpg'

// Generate public URL
const url = getPublicUrl(
  'https://your-project.supabase.co',
  'listings-images',
  path
);
// Returns: 'https://your-project.supabase.co/storage/v1/object/public/listings-images/vendors/...'

// Parse path to extract info
const info = parseStoragePath(path);
// Returns: { vendorId: 'a7b8c9d0...', productSlug: 'wireless-mouse' }
```

---

### 2. `src/lib/storageManager.js`

High-level API for managing vendor product images.

**Functions:**

```javascript
import {
  uploadProductMainImage,      // Upload main product image
  uploadProductThumbnail,      // Upload product thumbnail
  uploadProductGalleryImage,   // Upload gallery image
  deleteProductImage,          // Delete single image
  deleteProductImages,         // Delete all product images
  listVendorProductImages,     // List vendor's images
  listProductImages,           // List product's images
  getProductMainImageUrl,      // Get public URL
  getProductThumbnailUrl,
  getProductGalleryImageUrl
} from '@/lib/storageManager';
```

**Examples:**

```javascript
// Upload main image
const { path, publicUrl } = await uploadProductMainImage(
  supabase,
  vendorId,
  productSlug,
  imageBuffer,
  'image/jpeg'
);

// List all images for a vendor's products
const images = await listVendorProductImages(supabase, vendorId);

// List images for specific product
const productImages = await listProductImages(supabase, vendorId, productSlug);

// Delete all product images
await deleteProductImages(supabase, vendorId, productSlug);

// Get public URL
const url = getProductMainImageUrl(supabase, vendorId, productSlug);
```

---

## Scripts

### `scripts/test-vendor-storage.js`

Test the vendor storage structure and path generation.

```bash
node scripts/test-vendor-storage.js
```

**Output:**
- Displays generated paths and public URLs
- Tests storage access
- Shows directory structure

### `scripts/upload-vendor-product-images.js`

Upload product images with the vendor-organized structure.

```bash
node scripts/upload-vendor-product-images.js
```

**Features:**
- Downloads images from URL
- Resizes to appropriate dimensions
- Compresses to JPEG (85% quality)
- Uploads to vendor-specific directory
- Returns public URLs

**Example Usage:**

```javascript
import { uploadProductImages } from './scripts/upload-vendor-product-images.js';

const results = await uploadProductImages(
  vendorId,        // UUID
  productSlug,     // 'wireless-mouse'
  {
    main: 'https://example.com/image.jpg',
    gallery: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg'
    ]
  }
);

// Results:
// {
//   main: 'https://.../',
//   thumbnail: 'https://.../',
//   gallery: ['https://.../', 'https://.../', ...]
// }
```

---

## Benefits

### Organization
- Images are logically grouped by vendor
- Easy to identify and manage vendor assets
- Simplified directory traversal

### Performance
- List vendor images without query overhead
- Efficient caching per vendor
- Scalable to many vendors

### Security
- Can implement vendor-specific access controls
- Easy to audit vendor asset usage
- Vendor data is isolated in storage

### Maintenance
- Easy to delete all vendor images at once
- Can implement vendor asset quotas
- Simplified backup/export per vendor

---

## Implementation in Components

### Vue Component Example

```vue
<script setup>
import {
  getProductMainImageUrl,
  uploadProductMainImage
} from '@/lib/storageManager';
import { supabase } from '@/lib/customSupabaseClient';

const vendorId = route.params.vendorId;
const productSlug = route.params.slug;

// Get existing image URL
const imageUrl = getProductMainImageUrl(supabase, vendorId, productSlug);

// Upload new image
async function handleImageUpload(file) {
  const buffer = await file.arrayBuffer();
  const { publicUrl } = await uploadProductMainImage(
    supabase,
    vendorId,
    productSlug,
    Buffer.from(buffer)
  );
  return publicUrl;
}
</script>

<template>
  <img :src="imageUrl" :alt="productSlug" />
  <input type="file" @change="(e) => handleImageUpload(e.target.files[0])" />
</template>
```

---

## Database Integration

Update product records with image URLs:

```javascript
const imageUrl = getProductMainImageUrl(supabase, vendorId, productSlug);

const { error } = await supabase
  .from('products')
  .update({ image_url: imageUrl })
  .eq('id', productId)
  .eq('vendor_id', vendorId);
```

---

## Troubleshooting

### "Cannot list vendor images"
- Check vendor_id is correctly formatted (UUID)
- Verify `listings-images` bucket exists
- Check RLS policies allow bucket access

### "Upload fails with large images"
- Images are automatically compressed (max 2MB)
- If still too large, try JPG instead of PNG
- Reduce image quality if needed

### "URL returns 404"
- Verify image was actually uploaded
- Check path matches storage exactly
- Ensure URL is public (not signed)

---

## Future Enhancements

- Batch image upload operations
- Image transformation (resize, crop, filter)
- CDN caching optimization
- Analytics (image views, downloads)
- Image variants (thumbnail, mobile, desktop)
