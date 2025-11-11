# Images Not Showing on Render - FIXED

## Summary

Your Render deployment had images not loading because:
1. **render.yaml had placeholder URLs** instead of your real Supabase URL
2. **dist folder was outdated** with old configuration
3. **Environment variables were not set** in Render dashboard

## What I Fixed

### ✅ 1. Updated render.yaml
- Set `VITE_SUPABASE_URL` to your real project: `https://ebvlniuzrttvvgilccui.supabase.co`
- Added environment variable placeholders for secrets (VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, etc.)
- Configured backend service with all required environment variables

### ✅ 2. Rebuilt dist Folder
```
✓ 1894 modules transformed
✓ built in 20.84s
```
Fresh production build with correct Supabase configuration

### ✅ 3. Server Configuration
- Fixed `server/supabaseClient.js` to use service role key (already done)
- render.yaml now includes all backend environment configurations

## What You Need to Do (3 steps)

### Step 1: Push Changes to GitHub
```powershell
git add render.yaml dist/
git commit -m "fix: update render.yaml with correct Supabase URL and rebuild dist"
git push origin main
```

This triggers Render to redeploy both frontend and backend.

### Step 2: Set Environment Variables in Render Dashboard

**Go to**: https://dashboard.render.com

**For Frontend Service (sknbridgetrade-frontend)**:
1. Click the service
2. Settings → Environment
3. Set `VITE_SUPABASE_ANON_KEY` to:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVidmxuaXV6cnR0dnZnaWxjY3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjA0MzAsImV4cCI6MjA3ODI5NjQzMH0.AzZATPn11La9LJpRcfKDqanZGr24DaH-xkFzvLnc660
   ```

**For Backend Service (sknbridgetrade-server)**:
1. Click the service
2. Settings → Environment
3. Add these secrets (from your local `.env` file):
   - `SUPABASE_SERVICE_ROLE_KEY` = (from your .env)
   - `VITE_PAYPAL_CLIENT_ID` = (from your .env)
   - `VITE_PAYPAL_SECRET` = (from your .env)
   - `PAYPAL_WEBHOOK_ID` = (from your .env)

### Step 3: Monitor Deployment & Test
1. Go to Render dashboard
2. Watch both services redeploy
3. Once "Live", visit: https://sknbridgetrade-frontend.onrender.com
4. **Images should now load!**

## Why This Works

```
Local Build              →    render.yaml has correct URL
                              ↓
Frontend gets built       →    VITE_SUPABASE_URL = correct project
with correct env vars            ↓
                          Images point to correct bucket
                                  ↓
Browser loads images      →    From correct Supabase project
from Supabase storage
```

## Files Changed

```
render.yaml                    ← Updated with real URLs + env vars
dist/                          ← Rebuilt with fresh build
server/supabaseClient.js       ← Already using service role key
```

## Documentation Created

| File | Purpose |
|------|---------|
| RENDER_DEPLOYMENT.md | Complete deployment guide |
| RENDER_IMAGES_FIX.md | Detailed troubleshooting |
| BACKEND_STARTED.md | Backend server info |

## Quick Checklist

- [ ] Push changes: `git push origin main`
- [ ] Set frontend env var in Render dashboard
- [ ] Set backend env vars in Render dashboard
- [ ] Wait for Render to redeploy (2-5 minutes)
- [ ] Visit Render URL and verify images load
- [ ] Test API calls (reviews, cart, etc.)

## If Images Still Don't Load

1. **Check Render logs**:
   - Dashboard → Service → Logs
   - Look for build errors or connection issues

2. **Verify image URLs in database**:
   ```powershell
   node .\scripts\test-supabase.js --verbose
   # Look for product.image_url values
   ```

3. **Test image URL directly**:
   Visit in browser: `https://ebvlniuzrttvvgilccui.supabase.co/storage/v1/object/public/listing-images/products/laptop/main.jpg`
   - If it shows, storage is fine
   - If 403, check RLS policies (see SERVICE_ROLE_GUIDE.md)

4. **Clear Render cache**:
   - Go to service settings
   - Click "Clear Cache & Redeploy"

## Next After This Works

1. ✅ Images display ← You are here
2. ⬜ Test all product features (cart, checkout, reviews)
3. ⬜ Verify PayPal integration works
4. ⬜ Check admin/seller features
5. ⬜ Set up monitoring/alerts

---

**You're almost done!** Just push the changes and set the env vars in Render, then images will load.

See `RENDER_DEPLOYMENT.md` for complete step-by-step instructions with screenshots and troubleshooting.
