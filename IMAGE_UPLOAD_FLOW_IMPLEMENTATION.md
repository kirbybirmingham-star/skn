# Image Upload Flow - Cached Upload Implementation

**Date:** December 31, 2025  
**Status:** ✅ Complete and Deployed

## Summary

Implemented a **two-stage image upload flow** to resolve Supabase RLS (Row Level Security) permission issues:

1. **Frontend caches the image file** when selected (no immediate upload)
2. **Product is saved first** to the database
3. **Backend handles the actual image upload** to Supabase storage with proper service role permissions

## Problems Solved

### Previous Issue
- Direct frontend upload to Supabase was failing with: `StorageApiError: new row violates row-level security policy`
- Images were attempting to upload before product was created
- RLS policies blocked anonymous/user-level uploads

### Solution
- **Server-side upload**: Backend uses service role credentials with full permissions
- **Sequential workflow**: Product created → then image uploaded
- **Cache mechanism**: Images cached in memory during product creation

## Implementation Details

### Backend Changes

#### 1. **server/products.js** - New Image Upload Endpoint
```javascript
/**
 * POST /api/products/:productId/upload-image
 * Uploads image using service role credentials
 */
router.post('/:productId/upload-image', async (req, res) => {
  // Receives FormData with 'image' field
  // Uses service role key for upload (proper permissions)
  // Updates product.image_url after successful upload
  // Returns { success: true, imageUrl, product }
});
```

**Key Features:**
- Accepts multipart FormData with 'image' field
- Uses Supabase service role client (has full permissions)
- Automatically updates product record with new image URL
- Returns updated product data

#### 2. **server/index.js** - Multer Configuration
```javascript
// File upload middleware
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

// Route registration
app.post('/api/products/:productId/upload-image', upload.single('image'), routes.products);
```

**Changes:**
- Added `multer` dependency to handle file uploads
- Configured memory storage (files held in memory during upload)
- Added file type validation (images only)
- 10MB file size limit

#### 3. **Dependencies**
- Added: `"multer": "^1.4.4"` to package.json

### Frontend Changes

#### 1. **src/api/EcommerceApi.jsx** - New Backend Upload Function
```javascript
/**
 * Upload product image to backend
 * @param {string} productId - Product ID
 * @param {File} file - Image file to upload
 * @returns {Promise<{imageUrl: string, product: object}>}
 */
export async function uploadProductImageToBackend(productId, file) {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`/api/products/${productId}/upload-image`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(error.error || `Upload failed`);
  }
  
  return response.json();
}
```

**Key Points:**
- Sends file to backend instead of Supabase directly
- Uses FormData for multipart upload
- Handles errors gracefully
- Returns image URL from backend response

#### 2. **src/pages/vendor/Products.jsx** - Caching & Sequential Upload
```javascript
// New state
const [cachedImageFile, setCachedImageFile] = useState(null);
const [imagePreview, setImagePreview] = useState('');

// File input handler - caches instead of uploading
onChange={(e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Cache the file
  setCachedImageFile(file);
  
  // Create local preview
  const reader = new FileReader();
  reader.onload = (event) => {
    setImagePreview(event.target.result);
  };
  reader.readAsDataURL(file);
  
  toast({ title: 'Image cached', 
          description: 'Will upload on save' });
}}

// handleSave - now uploads after product creation
const handleSave = async () => {
  // Step 1: Save product to database
  let productId;
  if (editingId) {
    await updateProduct(editingId, {...});
    productId = editingId;
  } else {
    const p = await createProduct(vendor.id, {...});
    productId = p.id;
  }
  
  // Step 2: Upload image to backend if cached
  if (cachedImageFile) {
    try {
      await uploadProductImageToBackend(productId, cachedImageFile);
      toast({ title: 'Image uploaded successfully' });
    } catch (uploadErr) {
      toast({ 
        title: 'Product saved but image upload failed',
        description: String(uploadErr),
        variant: 'destructive'
      });
    }
  }
  
  // Step 3: Refresh product list
  const updatedProducts = await listProductsByVendor(vendor.id);
  setProducts(updatedProducts);
};
```

**Workflow:**
1. User selects image → cached in state + preview shown
2. User clicks "Save Product" → product created in DB
3. If image cached → upload to backend
4. Backend updates product with image URL
5. Product list refreshed with new image

## Data Flow Diagram

```
Frontend UI
    ↓
User selects image
    ↓
Image cached in state + local preview
(no upload yet)
    ↓
User saves product
    ↓
[1] Save product to DB → productId
    ↓
[2] If image cached → POST /api/products/:productId/upload-image
    ↓
Backend (multer parses FormData)
    ↓
Upload to Supabase storage (service role credentials)
    ↓
Get public URL
    ↓
Update product.image_url
    ↓
Return { imageUrl, product }
    ↓
Frontend refreshes product list
    ↓
Updated image now visible
```

## User Experience

### Before
❌ Image upload blocks product creation  
❌ RLS permission errors frustrate users  
❌ Unclear when upload happens  

### After
✅ Image selected → instant local preview  
✅ "Will upload on save" message clarifies timing  
✅ Product created first (guaranteed success)  
✅ Image upload handles errors gracefully  
✅ If upload fails, product is still saved  

## Error Handling

### Level 1: File Selection
- Only allows image files (validated by browser and multer)
- Shows toast if invalid file selected
- Displays "📦 Cached - will upload on save" indicator

### Level 2: Product Creation
- Product save happens first
- If fails → user sees error, product not created
- Image not attempted if product creation failed

### Level 3: Image Upload
- Backend uploads with service role (proper permissions)
- If upload fails → product already saved (partial success)
- User sees warning: "Product saved but image upload failed"
- Can retry upload by editing product

### Level 4: Product Refresh
- Product list refreshed after operations
- Displays final state with or without image

## Testing Workflow

1. **Navigate to:** Vendor Products page
2. **Click:** "Add New Product"
3. **Fill:** Title, Description, Category
4. **Select:** Image file
5. **Verify:** 
   - Local preview appears
   - "📦 Cached" indicator shown
   - Toast says "will upload on save"
6. **Click:** "Save Product"
7. **Verify:**
   - Product created in DB
   - Image uploaded to Supabase
   - Product appears in list with image

## Files Modified

### Backend
- ✅ `server/products.js` - Added `/:productId/upload-image` endpoint
- ✅ `server/index.js` - Added multer, registered products routes

### Frontend
- ✅ `src/api/EcommerceApi.jsx` - Added `uploadProductImageToBackend()` function
- ✅ `src/pages/vendor/Products.jsx` - Implemented caching and sequential upload
- ✅ `package.json` - Added multer dependency

## Benefits

1. **Security**: Backend uses service role credentials (proper permissions)
2. **UX**: Clear "cached" state with preview before save
3. **Reliability**: Product saved first, image optional
4. **Graceful Degradation**: Product saves even if image upload fails
5. **Simplicity**: Two-step process is intuitive

## Next Steps (Optional Enhancements)

- [ ] Add progress bar for image upload
- [ ] Support multiple images (gallery)
- [ ] Add image compression before upload
- [ ] Implement image cropping tool
- [ ] Add drag-and-drop support

## Deployment Notes

- Ensure backend has access to Supabase service role key
- Multer handles file in memory (suitable for most deployments)
- For high-volume, consider switching to disk storage
- Monitor file upload size limits (currently 10MB)
