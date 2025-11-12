# ACTION PLAN - Deploy Images Fix to Render

## Overview
Your local changes are ready to deploy. Follow these exact steps to get images showing on Render.

## Step 1: Review Changes (2 minutes)

**Files that changed**:
- ✅ `render.yaml` — Now has correct Supabase URL and env vars
- ✅ `dist/` — Rebuilt with fresh production build
- ✅ `server/supabaseClient.js` — Using service role key

**What changed in render.yaml**:
```yaml
# FRONTEND - BEFORE
VITE_SUPABASE_URL: YOUR_SUPABASE_URL          ❌ Placeholder
VITE_SUPABASE_ANON_KEY: YOUR_SUPABASE_ANON_KEY ❌ Placeholder

# FRONTEND - AFTER  
VITE_SUPABASE_URL: https://ebvlniuzrttvvgilccui.supabase.co  ✅ Real URL
VITE_SUPABASE_ANON_KEY: sync: false                         ✅ From secrets

# BACKEND - BEFORE
(No environment variables)                   ❌ Missing

# BACKEND - AFTER
VITE_SUPABASE_URL: https://ebvlniuzrttvvgilccui.supabase.co
SUPABASE_SERVICE_ROLE_KEY: sync: false
VITE_PAYPAL_CLIENT_ID: sync: false
VITE_PAYPAL_SECRET: sync: false
PAYPAL_WEBHOOK_ID: sync: false
NODE_ENV: production
PORT: "3001"
```

## Step 2: Commit & Push (2 minutes)

Run these commands in PowerShell:

```powershell
# Stage the key files
git add render.yaml

# Commit with clear message
git commit -m "fix: Render deployment - add correct Supabase URL and environment variables

- Set VITE_SUPABASE_URL to correct Supabase project (ebvlniuzrttvvgilccui)
- Add environment variable configuration for both frontend and backend
- Rebuild dist folder with fresh production build
- Backend now correctly uses service role key for database access"

# Push to main (triggers Render redeploy)
git push origin main
```

**Expected output**:
```
[main xxxxxxx] fix: Render deployment...
 1 file changed, 24 insertions(+)
 
Enumerating objects: 5, done.
...
To github.com:kirbybirmingham-star/skn.git
```

## Step 3: Set Render Environment Variables (5 minutes)

### 3a. Frontend Service - VITE_SUPABASE_ANON_KEY

1. Go to: https://dashboard.render.com
2. Click **sknbridgetrade-frontend** (static site)
3. Click **Settings** tab
4. Scroll to **Environment**
5. Find `VITE_SUPABASE_ANON_KEY` 
6. Click edit and paste:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVidmxuaXV6cnR0dnZnaWxjY3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjA0MzAsImV4cCI6MjA3ODI5NjQzMH0.AzZATPn11La9LJpRcfKDqanZGr24DaH-xkFzvLnc660
   ```
7. Click **Save**

### 3b. Backend Service - All Secrets

1. Go to: https://dashboard.render.com
2. Click **sknbridgetrade-server** (web service)
3. Click **Settings** tab
4. Scroll to **Environment**
5. For each of these, copy from your local `.env` file:

   **SUPABASE_SERVICE_ROLE_KEY**:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVidmxuaXV6cnR0dnZnaWxjY3VpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcyMDQzMCwiZXhwIjoyMDc4Mjk2NDMwfQ.BSmgqEqUO_IgxCbppUG-V5j1ixD-0TsGPGIDKUlPfsU
   ```

   **VITE_PAYPAL_CLIENT_ID**:
   ```
   AaHAhyaqVYOlqoNdFerJ2hkgQtLbpRwUyj1WnjIBQGbx2FVXLXu1Oj4Ybkxcpfmlv6BNy1GfwfE47IpZ
   ```

   **VITE_PAYPAL_SECRET**:
   ```
   EMHJL0A3i34vyvKuf6K3NU_lvVxFhxjkXeCFd0Yc_R8CP0oJO3Nt90_bw_SqfJfK0FlcsZg4e9WrddAx
   ```

   **PAYPAL_WEBHOOK_ID**:
   ```
   653869666M736574P
   ```

6. Click **Save** after each one

## Step 4: Wait for Redeploy (3-5 minutes)

1. Go to https://dashboard.render.com
2. Watch both services:
   - **sknbridgetrade-frontend** (static site)
   - **sknbridgetrade-server** (web service)
3. Look for deployment status changing from "Building" → "Live"
4. Both should show "Live" (green)

**What to look for in logs**:
```
✓ 1894 modules transformed
✓ built in 20.84s
```

## Step 5: Test the Deployment (2 minutes)

1. Open your browser
2. Visit: https://sknbridgetrade-frontend.onrender.com
3. **Images should now load on product cards** ✅
4. Try these:
   - Hover over products → image loads
   - Click product → detail page loads images
   - Add to cart → works
   - Look at reviews → they load

**If something doesn't work**:
- Hard refresh: `Ctrl+Shift+R`
- Wait 10 seconds for static cache to clear
- Check browser console for errors

## Timeline

| Step | Time | Status |
|------|------|--------|
| Review changes | 2 min | ✅ Instant |
| Commit & push | 2 min | ✅ Instant |
| Render redeploy starts | 1 min | ⏳ Wait |
| Frontend builds | 1-2 min | ⏳ Watch logs |
| Backend starts | 1-2 min | ⏳ Watch logs |
| Services live | 5 min | 🎉 Done |
| **Total** | **~10 min** | |

## After Deployment ✅

- [ ] Frontend images load
- [ ] API calls work (reviews, products, orders)
- [ ] Cart and checkout function
- [ ] Admin features work (if applicable)

## Troubleshooting

### "Images still not showing"
1. Hard refresh: `Ctrl+Shift+R`
2. Wait 30 seconds (static cache)
3. Check browser console for image URL
4. Verify `VITE_SUPABASE_ANON_KEY` is set in Render

### "Build failed"
1. Check Render build logs for errors
2. Common issue: Missing environment variable
3. Make sure all backend env vars are set

### "API calls failing"
1. Verify backend service is "Live" in Render
2. Check backend env vars are all set
3. Look at backend service logs for errors

## Need Help?

**Check these docs**:
- `RENDER_DEPLOYMENT.md` — Complete deployment guide
- `RENDER_IMAGES_FIX.md` — Detailed troubleshooting
- `IMAGES_FIX_SUMMARY.md` — Overview of what was fixed

---

## Command Cheat Sheet

```powershell
# Step 1: Commit and push
git add render.yaml
git commit -m "fix: Render deployment - add correct Supabase URL"
git push origin main

# Step 2: Then set env vars in Render dashboard (https://dashboard.render.com)

# Step 3: Test locally while waiting
npm run build
npm run preview  # Preview prod build locally

# Step 4: After deployment, test
# Visit: https://sknbridgetrade-frontend.onrender.com
```

---

**Ready? Start with "Step 2: Commit & Push" above!**
