# Fix: Images Not Showing on Render Deployment

## Problem
Images are not displaying on the Render-deployed site even though they show locally.

## Root Causes

### 1. **Local `dist` folder is outdated**
- Built with old environment variables or database references
- Images stored in old Supabase project or old bucket names

### 2. **Render deployment has wrong env vars**
- `VITE_SUPABASE_URL` is still the placeholder in `render.yaml`
- Frontend can't construct correct image URLs without the real Supabase project URL

### 3. **Image URLs in database**
- May point to wrong bucket (`product-images` vs `listing-images`)
- May reference old Supabase project

## Solution

### Step 1: Update render.yaml with Real Values

Edit `render.yaml` and replace placeholders:

```yaml
services:
  - type: web_service
    name: sknbridgetrade-server
    # ... backend config ...
    
  - type: static_site
    name: sknbridgetrade-frontend
    env: static
    plan: free
    region: oregon
    repo: .
    buildCommand: "npm install && npm run build"
    publishPath: "dist"
    branch: main
    envVars:
      - key: VITE_SUPABASE_URL
        value: https://ebvlniuzrttvvgilccui.supabase.co  # ← Your real URL
      - key: VITE_SUPABASE_ANON_KEY
        value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ← Your real anon key
      - key: VITE_API_URL
        value: https://sknbridgetrade-server.onrender.com
      - key: VITE_PAYPAL_CLIENT_ID
        value: YOUR_PAYPAL_CLIENT_ID  # ← Add if needed
```

### Step 2: Rebuild Local Dist

Clean and rebuild the dist folder with current env vars:

```powershell
# Remove old build
Remove-Item -Recurse -Force dist

# Rebuild with fresh environment
npm run build
```

**Important**: Make sure your `.env` file has the correct `VITE_SUPABASE_URL` before running build.

### Step 3: Verify Image URLs in Database

Check what image URLs are stored in the products table:

```powershell
# Run diagnostic
node .\scripts\diagnose-service-role.js

# Or run this specific query
node -e "
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
s.from('products').select('slug, image_url').limit(3).then(r => {
  console.log(JSON.stringify(r.data, null, 2));
  process.exit(0);
});
" -i module
```

Expected output: Image URLs should look like:
```
https://ebvlniuzrttvvgilccui.supabase.co/storage/v1/object/public/listing-images/products/laptop/main.jpg
```

### Step 4: Fix Image URLs If Needed

If images point to wrong bucket or old project, update them:

**Option A: Update in Database (SQL)**
```sql
UPDATE public.products 
SET image_url = REPLACE(image_url, 'product-images', 'listing-images')
WHERE image_url LIKE '%product-images%';

UPDATE public.products 
SET image_url = REPLACE(image_url, 'OLD_PROJECT_ID', 'ebvlniuzrttvvgilccui')
WHERE image_url LIKE '%supabase.co%';
```

**Option B: Re-upload Images**
```powershell
node .\scripts\upload-sample-images.js
```

### Step 5: Deploy to Render

1. **Commit updated render.yaml**:
   ```powershell
   git add render.yaml
   git commit -m "fix: update render env vars for correct Supabase project"
   git push origin main
   ```

2. **Render automatically redeploys** when main branch updates

3. **Monitor deployment**:
   - Go to https://dashboard.render.com
   - Watch deployment logs
   - Verify build uses new VITE_SUPABASE_URL

### Step 6: Verify

1. **Visit deployed frontend**: https://sknbridgetrade-frontend.onrender.com (or your Render URL)
2. **Images should now load**
3. **Check browser console** for any errors referencing image URLs

## Troubleshooting

### Images still not showing

**Check these in order:**

1. **Are image URLs in database correct?**
   ```powershell
   node .\scripts\test-supabase.js --verbose
   ```
   Look for product image_url fields

2. **Can you access images directly in browser?**
   Visit an image URL directly: `https://ebvlniuzrttvvgilccui.supabase.co/storage/v1/object/public/listing-images/products/laptop/main.jpg`
   - If it loads, storage is working
   - If 403/404, check RLS policies on storage bucket

3. **Check Render build logs**:
   - Go to Render dashboard
   - Click on frontend service
   - View build logs → check if VITE_SUPABASE_URL is correct

4. **Clear browser cache**:
   ```
   Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
   ```

## What Each Component Does

| Component | What It Does | Where It Runs |
|-----------|------------|---------------|
| **dist folder** | Built frontend HTML/CSS/JS | Render static site + local |
| **VITE_SUPABASE_URL** | Tells frontend where Supabase is | Build time & runtime |
| **Image URLs** | Point to specific storage bucket | Database + frontend display |
| **Storage bucket** | Holds the actual image files | Supabase |

## Quick Checklist

- [ ] `render.yaml` has real `VITE_SUPABASE_URL` (not placeholder)
- [ ] `render.yaml` has real `VITE_SUPABASE_ANON_KEY` (not placeholder)
- [ ] Local `.env` has correct `VITE_SUPABASE_URL`
- [ ] Rebuilt `dist` folder with `npm run build`
- [ ] Image URLs in database point to correct bucket (`listing-images`)
- [ ] Image URLs in database include correct Supabase project ID
- [ ] Render deployment has redeployed after render.yaml changes
- [ ] Tested direct image URL access in browser

---

**After these steps, images should load correctly on Render deployment!**

If issues persist, run `node .\scripts\test-supabase.js --verbose` and share the output.
