# Render Deployment Guide - Images Fix Complete

## What Was Fixed

### 1. ✅ Updated render.yaml
- Added real `VITE_SUPABASE_URL` (https://ebvlniuzrttvvgilccui.supabase.co)
- Added environment variable placeholders for sensitive values (to be set in Render dashboard)
- Added backend environment configuration with proper secrets handling

### 2. ✅ Rebuilt dist Folder
- Fresh build with correct Supabase configuration
- All image references now point to the correct project URL

## What render.yaml Now Contains

### Frontend Service
```yaml
envVars:
  - key: VITE_SUPABASE_URL
    value: https://ebvlniuzrttvvgilccui.supabase.co    # ✓ Real URL
  - key: VITE_SUPABASE_ANON_KEY
    sync: false                                         # Secret from Render
  - key: VITE_API_URL
    value: https://sknbridgetrade-server.onrender.com
```

### Backend Service
```yaml
envVars:
  - key: VITE_SUPABASE_URL
    value: https://ebvlniuzrttvvgilccui.supabase.co
  - key: SUPABASE_SERVICE_ROLE_KEY
    sync: false                                         # Secret from Render
  - key: VITE_PAYPAL_CLIENT_ID
    sync: false                                         # Secret from Render
  - key: VITE_PAYPAL_SECRET
    sync: false                                         # Secret from Render
  - key: PAYPAL_WEBHOOK_ID
    sync: false                                         # Secret from Render
  - key: NODE_ENV
    value: production
```

## Deployment Steps

### Step 1: Set Environment Variables in Render Dashboard

1. Go to https://dashboard.render.com
2. **For Frontend Service (sknbridgetrade-frontend)**:
   - Click on service
   - Go to Settings → Environment
   - Verify `VITE_SUPABASE_URL` is set to: `https://ebvlniuzrttvvgilccui.supabase.co`
   - Set `VITE_SUPABASE_ANON_KEY` to your actual anon key:
     ```
     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVidmxuaXV6cnR0dnZnaWxjY3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjA0MzAsImV4cCI6MjA3ODI5NjQzMH0.AzZATPn11La9LJpRcfKDqanZGr24DaH-xkFzvLnc660
     ```

3. **For Backend Service (sknbridgetrade-server)**:
   - Click on service
   - Go to Settings → Environment
   - Add these secrets (from your `.env` file):
     - `SUPABASE_SERVICE_ROLE_KEY` = your service role key
     - `VITE_PAYPAL_CLIENT_ID` = your PayPal client ID
     - `VITE_PAYPAL_SECRET` = your PayPal secret
     - `PAYPAL_WEBHOOK_ID` = your webhook ID

### Step 2: Commit and Push

```powershell
# Stage changes
git add render.yaml dist/

# Commit
git commit -m "fix: update render.yaml with correct Supabase URLs and rebuild dist

- Set VITE_SUPABASE_URL to correct Supabase project
- Add env var placeholders for secrets
- Rebuild dist with fresh build"

# Push to trigger Render deployment
git push origin main
```

### Step 3: Monitor Deployment

1. Go to https://dashboard.render.com
2. Watch both services rebuild:
   - **sknbridgetrade-frontend** (Static Site)
   - **sknbridgetrade-server** (Web Service)

3. Look for deployment logs and any build errors

4. Once complete, both services should show "Live"

### Step 4: Test

1. **Visit your frontend**: https://sknbridgetrade-frontend.onrender.com
2. **Images should now load** on product cards
3. **Reviews and other data** should also load correctly

## Troubleshooting

### "Images still not showing on Render"

**Possible causes & fixes:**

1. **Environment variables not set in Render**
   - Check Render dashboard
   - Verify `VITE_SUPABASE_URL` is exactly: `https://ebvlniuzrttvvgilccui.supabase.co`
   - Re-trigger deployment after setting vars

2. **Image URLs in database are wrong**
   - Run locally: `node .\scripts\test-supabase.js --verbose`
   - Check if product.image_url contains correct Supabase URL
   - If not, re-run upload script: `node .\scripts\upload-sample-images.js`

3. **Storage bucket permissions**
   - Verify `listing-images` bucket exists in Supabase
   - Check RLS policies allow public read
   - Or run the RLS fix from `SERVICE_ROLE_GUIDE.md`

4. **Render still serving old dist**
   - Clear Render cache in dashboard
   - Manually trigger redeploy
   - Wait 1-2 minutes for cache to clear

### "API calls failing on Render"

**Possible causes:**

1. **Backend service not started**
   - Check backend service status in Render dashboard
   - Look for error logs

2. **CORS issues**
   - Frontend URL changed after deployment?
   - Check `server/index.js` CORS config
   - Add Render deployment URL to allowedHosts

3. **Backend environment vars not set**
   - Backend needs `SUPABASE_SERVICE_ROLE_KEY`
   - Verify in Render dashboard

## Quick Reference

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | Deployed | https://sknbridgetrade-frontend.onrender.com |
| Backend API | Deployed | https://sknbridgetrade-server.onrender.com |
| Supabase Project | Live | https://ebvlniuzrttvvgilccui.supabase.co |
| Database Bucket | listing-images | See Supabase Storage |

## Files Modified

- ✅ `render.yaml` — Updated with real Supabase URL + env var config
- ✅ `dist/` — Rebuilt with correct Supabase configuration

## Next Steps

After images load correctly:

1. **Set up automatic deployments**
   - Render auto-deploys on git push (already configured)

2. **Monitor in production**
   - Check Render logs for errors
   - Monitor Supabase storage for access

3. **Test all features**
   - Add to cart
   - Checkout
   - Reviews
   - Admin functions (if applicable)

---

**After following these steps, your images should load correctly on Render!**

Questions? Check `RENDER_IMAGES_FIX.md` for detailed troubleshooting.
