# Live Site CORS Fix – Action Plan

## Root Cause
The deployed frontend (`https://skn-2.onrender.com`) is trying to reach `http://localhost:3001` instead of the backend service URL `https://sknbridgetrade-server.onrender.com`. This happens because **the build was created with `VITE_API_URL` unset or not injected into the Vite build** — causing the JavaScript to use the fallback localhost value.

### Error on Live Site
```
Access to fetch at 'http://localhost:3001/api/onboarding/me' from origin 'https://skn-2.onrender.com' has been blocked by CORS policy
```

## Changes Made ✅

### 1. **Enhanced Environment Validation** (`scripts/validate-build-env.js`)
- **New file** that checks `VITE_API_URL` and `VITE_SUPABASE_*` env vars are present and NOT pointing to localhost in production builds.
- Fails the build immediately if these critical vars are missing or misconfigured.
- Prevents future silent failures like this one.

### 2. **Updated Build Scripts**
- **`package.json`**: Changed `"build"` script to run validation first:
  ```json
  "build": "node scripts/validate-build-env.js && vite build"
  ```
- **`render.yaml`**: Updated frontend build command to include validation:
  ```yaml
  buildCommand: "npm install && node scripts/validate-build-env.js && npm run build"
  ```
- Also added `NODE_ENV: production` to frontend env vars (for consistency with validation logic).

### 3. **Existing Improvements**
- Backend `/health` endpoint already exists and will report if env vars are set.
- `SupabaseAuthContext.jsx` now handles non-JSON responses gracefully (won't crash with "Unexpected token '<'").
- `server/onboarding.js` now logs when `/api/onboarding/me` is called.

## Deployment Steps

### Step 1: Rebuild Frontend on Render (CRITICAL)
The `render.yaml` changes are necessary, but won't automatically trigger a rebuild. You must manually rebuild:

1. Go to **Render Dashboard** → **sknbridgetrade-frontend**
2. Click **Manual Deploy** (or **Clear build cache + Deploy** if available)
3. The build will now:
   - Run `npm install`
   - Run `node scripts/validate-build-env.js` (will print validation results and verify `VITE_API_URL` is set)
   - Run `npm run build` (Vite will inject `VITE_API_URL=https://sknbridgetrade-server.onrender.com` into the built JavaScript)

### Step 2: Verify Backend is Running
- Check backend health: `curl https://sknbridgetrade-server.onrender.com/health`
- Expected response: JSON with Supabase and PayPal config status.

### Step 3: Test Frontend Endpoint
- Once frontend is redeployed, try:
  ```bash
  curl -v https://skn-2.onrender.com/api/onboarding/me
  ```
- Expected: HTTP 401 (missing Authorization header) with JSON error, **not** HTML.

### Step 4: Monitor Live Site
- Visit `https://skn-2.onrender.com` and sign in to an onboarding page.
- Check browser DevTools Console for:
  - No "Unexpected token '<'" errors.
  - No CORS errors when calling `/api/onboarding/me`.
  - Vendor data should load (or `null` if no vendor exists, which is OK).
- If backend is unreachable, you'll see a helpful error message with response preview (added in `SupabaseAuthContext.jsx`).

## Verification Checklist

- [ ] Render frontend manual deploy initiated
- [ ] Build log shows: `✅ VITE_API_URL is set: https://sknbridgetrade-server.onrender.com`
- [ ] Build log shows: `✅ VITE_SUPABASE_URL is set: https://ebvlniuzrttvvgilccui.supabase.co`
- [ ] Frontend deployed successfully (check "Deploys" tab)
- [ ] `curl https://sknbridgetrade-server.onrender.com/health` returns JSON (not HTML)
- [ ] `curl https://skn-2.onrender.com/api/onboarding/me` returns JSON (not HTML)
- [ ] Live site onboarding dashboard loads without CORS errors
- [ ] Browser console has no "Unexpected token" or CORS errors

## Future Prevention

- **Build Validation**: Any future builds that try to set `VITE_API_URL` to localhost or leave it unset will **fail immediately** (error message will be clear).
- **Health Endpoint**: Backend `/health` endpoint provides quick feedback on deployed config.
- **Better Error Logging**: Frontend now logs response preview if backend returns non-JSON (helps diagnose routing issues).

---

## Fallback: If Manual Rebuild Doesn't Fix It

If the frontend still shows CORS errors after the rebuild:

1. Check **Render Frontend Env Vars** directly in dashboard:
   - `VITE_API_URL` should be `https://sknbridgetrade-server.onrender.com` ✅
   - `VITE_SUPABASE_URL` should be `https://ebvlniuzrttvvgilccui.supabase.co` ✅

2. Check backend is responding:
   ```bash
   curl -v https://sknbridgetrade-server.onrender.com/health
   curl -v https://sknbridgetrade-server.onrender.com/api/onboarding/me
   ```

3. If backend returns HTML for `/api/*`:
   - Backend may not be running or reachable.
   - Check Render backend service **Logs** tab for errors.

---

**Next:** Proceed to Render dashboard and trigger a manual rebuild of the frontend. Then report back once complete!
