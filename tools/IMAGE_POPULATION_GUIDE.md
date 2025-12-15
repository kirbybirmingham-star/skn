# Product Image Population Guide

This directory contains tools to manage product images in the SKNbridgetrade database.

## Current Status

✅ **All products have images!** (33/33 products)

The database currently has all products assigned with image URLs. These tools are available for future use when new products are added.

## Scripts

### 1. `list-products-images.js` - List Products & Image Status

Lists all products and identifies which ones are missing images.

**Usage:**
```bash
node tools/list-products-images.js
```

**Requirements:**
- `SUPABASE_URL` environment variable
- `SUPABASE_SERVICE_ROLE_KEY` or `VITE_SUPABASE_ANON_KEY` environment variable

**Output:**
- Console summary showing total products, with images, and missing images
- `products.json` file with full product data

### 2. `populate-product-images.js` - Auto-Populate Missing Images

Automatically downloads images from Unsplash for products missing images, uploads them to Supabase storage, and updates product records.

**Usage:**
```bash
node tools/populate-product-images.js
```

**Requirements:**
- `SUPABASE_URL` environment variable
- `SUPABASE_SERVICE_ROLE_KEY` environment variable (required for uploading)
- `UNSPLASH_ACCESS_KEY` environment variable (get free key at https://unsplash.com/oauth/applications)

**How it works:**
1. Queries all products from the database
2. Identifies products missing images
3. For each missing product:
   - Searches Unsplash using the product title/name as query
   - Downloads the best matching royalty-free image
   - Uploads to Supabase `product-images` bucket
   - Updates the product record with the image URL

**Rate Limiting:**
- Unsplash free tier: 50 requests per hour
- Script includes 1-second delay between requests to stay within limits

**Output:**
```
📊 Summary
===========
Total products: 100
Products missing images: 25
Successfully updated: 24
Failed: 1
Skipped: 0
```

## Setup Instructions

### 1. Get Unsplash API Key (Free)

1. Visit https://unsplash.com/oauth/applications
2. Create a new application
3. Accept the terms and create
4. Copy your "Access Key"
5. Add to `.env`:
   ```
   UNSPLASH_ACCESS_KEY=your_access_key_here
   ```

### 2. Set Supabase Credentials

Add to `.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Ensure Storage Bucket Exists

The script uploads to the `product-images` bucket. Verify it exists in Supabase:
- Navigate to Storage in Supabase Console
- Create `product-images` bucket if missing
- Set to public (or ensure bucket policies allow uploads)

## Workflow

### Step 1: Check Current Status
```bash
node tools/list-products-images.js
```

### Step 2: Auto-Populate Images (Recommended)
```bash
node tools/populate-product-images.js
```

### Step 3: Verify in UI
1. Navigate to Vendor Products
2. Check that products now show thumbnail images
3. Click products to verify images load correctly

## Troubleshooting

### "Missing Supabase credentials"
- Ensure `.env` file has `SUPABASE_URL` and either `SUPABASE_SERVICE_ROLE_KEY` or `VITE_SUPABASE_ANON_KEY`

### "Unsplash API error"
- Check your `UNSPLASH_ACCESS_KEY` is valid
- Check you haven't exceeded rate limit (50/hour free tier)
- Try a different search term if specific product name returns no results

### Images not appearing after upload
- Check Supabase Console > Storage > product-images bucket
- Verify bucket policies allow public read access
- Check that `image_url` field was updated in products table

### Upload fails to Supabase
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not just anon key)
- Verify `product-images` bucket exists and is writable
- Check bucket permissions in Supabase Console

## Manual Image Upload (Alternative)

If automatic population doesn't work, you can manually upload:

1. In Supabase Console:
   - Go to Storage > product-images
   - Drag and drop images

2. In UI (Vendor Products):
   - Click edit product
   - Click image input field
   - Upload file directly
   - Copy resulting URL
   - Paste into "Image URL" field

## Image Formats Supported

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

## Notes

- Unsplash images are free to use (CC0 license)
- Downloaded images are cached temporarily in `.tmp-images/` (auto-deleted)
- Script respects rate limits to avoid API blocks
- Failed uploads don't block other products from being processed
