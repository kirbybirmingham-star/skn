# Image Management System - Deployment Checklist

## Pre-Deployment Verification

- [ ] All files created successfully
  - [ ] `server/images.js` - Backend handler (250+ lines)
  - [ ] `src/api/imageApi.js` - API wrapper (150+ lines)
  - [ ] `src/components/image/ImageUpload.jsx` - React component (300+ lines)
  - [ ] `src/api/productImageApi.js` - Product logic (300+ lines, updated)

- [ ] Documentation complete
  - [ ] `IMAGE_MANAGEMENT_IMPLEMENTATION_GUIDE.md`
  - [ ] `PRODUCT_IMAGE_INTEGRATION_EXAMPLES.md`
  - [ ] `IMAGE_MANAGEMENT_COMPLETE_SUMMARY.md`
  - [ ] `IMAGE_MANAGEMENT_TECHNICAL_REFERENCE.md`

## Database Setup

- [ ] Add image_url column to products table
  ```sql
  ALTER TABLE products ADD COLUMN image_url VARCHAR(255);
  ```

- [ ] Add image_url column to product_variants table
  ```sql
  ALTER TABLE product_variants ADD COLUMN image_url VARCHAR(255);
  ```

- [ ] Create notifications table (for image flagging)
  ```sql
  CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    vendor_id UUID REFERENCES vendors(id),
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    reference_type VARCHAR(50),
    reference_id VARCHAR(255),
    metadata JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ```

- [ ] Create index on notifications.vendor_id and type
  ```sql
  CREATE INDEX idx_notifications_vendor_type ON notifications(vendor_id, type);
  CREATE INDEX idx_notifications_reference ON notifications(reference_type, reference_id);
  ```

- [ ] Verify Supabase storage buckets exist
  - [ ] `product-images` bucket exists
  - [ ] `vendor-images` bucket exists
  - [ ] `user-avatars` bucket exists
  - [ ] All buckets are PUBLIC (for CDN access)

## Backend Integration

- [ ] Import imageApi in main Express app
  ```javascript
  import imageApi from './images.js';
  ```

- [ ] Verify authentication middleware is in place
  ```javascript
  // In server/images.js
  const { authenticateUser } = require('./middleware/auth');
  ```

- [ ] Test backend endpoints
  ```bash
  # Test file upload
  curl -X POST http://localhost:3001/api/images/upload \
    -H "Authorization: Bearer TEST_TOKEN" \
    -F "image=@test.jpg" \
    -F "bucket=product-images"
  ```

- [ ] Check error handling
  - [ ] 401 for missing auth
  - [ ] 400 for invalid file
  - [ ] 413 for file too large
  - [ ] 415 for unsupported type

## Frontend Integration

- [ ] Import ImageUpload component in product creation form
  ```javascript
  import { ImageUpload } from '@/components/image/ImageUpload';
  ```

- [ ] Import imageApi functions
  ```javascript
  import { uploadImageFile, uploadImageFromUrl } from '@/api/imageApi';
  ```

- [ ] Import productImageApi functions
  ```javascript
  import { 
    getProductVariantsWithImages,
    updateProductImage,
    updateVariantImage 
  } from '@/api/productImageApi';
  ```

- [ ] Verify API wrapper endpoints match backend
  - [ ] POST `/api/images/upload`
  - [ ] POST `/api/images/upload-from-url`
  - [ ] POST `/api/images/validate-url`
  - [ ] DELETE `/api/images/:bucket/:filename`
  - [ ] GET `/api/images/placeholders`

## Product Forms Integration

### Product Creation Form
- [ ] Add ImageUpload component
- [ ] Call updateProductImage() after product created
- [ ] Show upload errors to user
- [ ] Show preview of selected image
- [ ] Make image required or optional as needed

### Product Edit Form
- [ ] Display current image
- [ ] Allow image replacement via ImageUpload
- [ ] Show loading state during update
- [ ] Display success message
- [ ] Handle errors gracefully

### Variant Management
- [ ] Implement getProductVariantsWithImages() in variant list
- [ ] Display effective image (variant → product → placeholder)
- [ ] Show "Using product image" badge when inherited
- [ ] Allow variant-specific image upload
- [ ] Call updateVariantImage() when image selected
- [ ] Flag variant for admin if needed

## Admin Dashboard Setup

- [ ] Create admin image management page
- [ ] Implement getVariantsNeedingImages() function
- [ ] Display list of variants without images
- [ ] Allow bulk image upload
- [ ] Show vendor-specific warnings via getVendorImageWarnings()
- [ ] Display products/variants missing images

## Testing Checklist

### Backend Tests
- [ ] File upload with valid file
  - [ ] Returns success
  - [ ] Filename is UUID-based
  - [ ] File appears in Supabase storage
  - [ ] URL is correct format

- [ ] File upload with invalid file
  - [ ] Rejects if too large
  - [ ] Rejects if wrong type
  - [ ] Rejects if no auth
  - [ ] Error message is helpful

- [ ] URL upload
  - [ ] Accepts valid URL
  - [ ] Validates URL is accessible
  - [ ] Downloads and stores file
  - [ ] Returns correct URL

- [ ] Validation endpoint
  - [ ] Validates accessible URLs
  - [ ] Rejects inaccessible URLs
  - [ ] Returns content type
  - [ ] Returns file size

- [ ] Deletion
  - [ ] Deletes file from storage
  - [ ] Returns success
  - [ ] Requires auth

- [ ] Placeholders
  - [ ] Returns all placeholders
  - [ ] URLs are valid
  - [ ] Images display correctly

### Frontend Tests
- [ ] ImageUpload component
  - [ ] File drag-drop works
  - [ ] File input works
  - [ ] File validation works
  - [ ] Preview displays
  - [ ] Clear button works
  - [ ] URL input works
  - [ ] Method toggle works
  - [ ] Loading state displays
  - [ ] Error messages display
  - [ ] onImageSelect callback fires

- [ ] Product creation
  - [ ] Upload image during creation
  - [ ] Image appears in product display
  - [ ] Image URL stored in database
  - [ ] Multiple uploads create unique files
  - [ ] Drag-drop works

- [ ] Product edit
  - [ ] Current image displays
  - [ ] Can replace image
  - [ ] New image updates in display
  - [ ] Database reflects change

- [ ] Variant display
  - [ ] Variant without image shows product image
  - [ ] "Using product image" badge shows
  - [ ] Badge disappears when variant image added
  - [ ] Can click to expand and add image

- [ ] Variant management
  - [ ] Variant image inheritance works
  - [ ] getProductVariantsWithImages returns correct data
  - [ ] has_own_image flag correct
  - [ ] needs_image_flag correct
  - [ ] effective_image correct

### Admin Tests
- [ ] Variants needing images
  - [ ] getVariantsNeedingImages() returns list
  - [ ] Admin can see variants without images
  - [ ] Can upload image for variant
  - [ ] Variant removed from list after upload

- [ ] Vendor warnings
  - [ ] getVendorImageWarnings() returns correct count
  - [ ] Shows products without images
  - [ ] Shows variants without images
  - [ ] Vendor can see their warnings

## Environment Configuration

- [ ] Verify Supabase project ID in config
  ```javascript
  // Check in config files
  SUPABASE_PROJECT_ID = "your-project-id"
  SUPABASE_URL = "https://your-project.supabase.co"
  ```

- [ ] Verify JWT secret for authentication
  ```javascript
  // Check in .env
  JWT_SECRET = "your-jwt-secret"
  ```

- [ ] Configure placeholder URLs if needed
  ```javascript
  // In server/images.js PLACEHOLDERS config
  const PLACEHOLDERS = {
    product: "https://your-domain.com/placeholder-product.png",
    avatar: "https://your-domain.com/placeholder-avatar.png",
    vendor: "https://your-domain.com/placeholder-vendor.png"
  };
  ```

## Performance Optimization

- [ ] Enable image CDN caching
  - [ ] Verify Supabase CDN is enabled
  - [ ] Test image cache headers
  - [ ] Verify global distribution

- [ ] Optimize image sizes
  - [ ] Recommend WebP format (smaller files)
  - [ ] Set appropriate dimensions
  - [ ] Compress large files

- [ ] Lazy load images where appropriate
  - [ ] Product lists should lazy load
  - [ ] Admin dashboard should paginate
  - [ ] Variant lists should paginate

## Security Verification

- [ ] Authentication checks
  - [ ] All POST endpoints require auth
  - [ ] All DELETE endpoints require auth
  - [ ] GET endpoints public (images not auth-required)
  - [ ] JWT validation works

- [ ] Authorization checks
  - [ ] Users can't upload to other users' products
  - [ ] Vendors can't manage other vendors' images
  - [ ] Admins can manage all images

- [ ] File validation
  - [ ] File size validated server-side (10MB)
  - [ ] MIME type validated server-side
  - [ ] File content validated (not just extension)
  - [ ] No executable files allowed

- [ ] Storage security
  - [ ] Supabase bucket policies correct
  - [ ] Public images can't be deleted by users
  - [ ] Storage secrets not exposed
  - [ ] No direct database access to images

## Documentation

- [ ] All documentation files created
  - [ ] IMAGE_MANAGEMENT_IMPLEMENTATION_GUIDE.md
  - [ ] PRODUCT_IMAGE_INTEGRATION_EXAMPLES.md
  - [ ] IMAGE_MANAGEMENT_COMPLETE_SUMMARY.md
  - [ ] IMAGE_MANAGEMENT_TECHNICAL_REFERENCE.md

- [ ] Developer can reference docs
  - [ ] API endpoints documented
  - [ ] React component props documented
  - [ ] Function signatures documented
  - [ ] Error handling documented
  - [ ] Examples provided for all features

- [ ] Admin can understand workflow
  - [ ] How to add variant images
  - [ ] How to manage missing images
  - [ ] How to resolve image issues
  - [ ] Where to find image management tools

## Post-Deployment

- [ ] Monitor image uploads
  - [ ] Check Supabase storage usage
  - [ ] Monitor upload success rate
  - [ ] Track failed uploads

- [ ] Monitor database
  - [ ] Check image_url fields populated
  - [ ] Monitor notifications table growth
  - [ ] Check indexes perform well

- [ ] Gather user feedback
  - [ ] Test with vendors
  - [ ] Get feedback on UI
  - [ ] Check error messages are clear
  - [ ] Verify variant inheritance works as expected

- [ ] Plan enhancements
  - [ ] Image optimization (auto-resize)
  - [ ] Image filters/effects
  - [ ] Bulk image import
  - [ ] Image analytics
  - [ ] CDN analytics

## Rollback Plan

If issues occur:

1. **Stop accepting new uploads**
   ```javascript
   // In server/images.js, temporarily disable endpoints
   app.post('/api/images/upload', (req, res) => {
     res.status(503).json({error: "Images temporarily unavailable"});
   });
   ```

2. **Revert database changes**
   ```sql
   -- Backup: Your data is still in Supabase
   -- Columns can be safely removed if needed
   ALTER TABLE products DROP COLUMN image_url;
   ALTER TABLE product_variants DROP COLUMN image_url;
   ```

3. **Restore previous version**
   - Git revert to previous deployment
   - Keep images in Supabase for future recovery
   - Document incident for analysis

4. **Communication**
   - Notify users of temporary unavailability
   - Estimate recovery time
   - Provide status updates

## Success Criteria

✅ All endpoints responding correctly
✅ File uploads creating unique filenames
✅ Images accessible via CDN
✅ Database storing image URLs
✅ Variant inheritance working
✅ Admin can find missing images
✅ No 401/403 errors for valid requests
✅ All tests passing
✅ Documentation complete
✅ Users can upload without errors

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Database setup | 30 min | [ ] |
| Backend integration | 1 hour | [ ] |
| Frontend integration | 2 hours | [ ] |
| Testing | 2 hours | [ ] |
| Documentation review | 30 min | [ ] |
| Deployment | 1 hour | [ ] |
| **Total** | **~7 hours** | [ ] |

## Sign-Off

- [ ] Developer: All code working as expected
- [ ] QA: All tests passing
- [ ] Product Owner: Feature meets requirements
- [ ] Deployment: Ready for production

**Deployment Date**: ___________

**Deployed By**: ___________

**Version**: 1.0.0

---

## Quick Links

- Backend Handler: `server/images.js`
- Frontend Component: `src/components/image/ImageUpload.jsx`
- API Wrapper: `src/api/imageApi.js`
- Product Logic: `src/api/productImageApi.js`
- Implementation Guide: `IMAGE_MANAGEMENT_IMPLEMENTATION_GUIDE.md`
- Code Examples: `PRODUCT_IMAGE_INTEGRATION_EXAMPLES.md`
- Technical Reference: `IMAGE_MANAGEMENT_TECHNICAL_REFERENCE.md`

## Support

For questions or issues:
1. Check `IMAGE_MANAGEMENT_TECHNICAL_REFERENCE.md` for detailed API docs
2. Review `PRODUCT_IMAGE_INTEGRATION_EXAMPLES.md` for implementation patterns
3. Check database schema in implementation guide
4. Review error handling section in technical reference

**Deployment status**: Ready for integration testing ✅
