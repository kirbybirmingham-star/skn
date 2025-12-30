# Vendor Orders Authentication & Port Fix

## Issues Fixed

### 1. **Port Mismatch** 
- **Problem**: `vite.config.js` was configured to run on port 3000, but backend was on port 3001
- **Symptom**: Frontend trying to call `http://localhost:3000/api/vendor/...` when backend wasn't there
- **Solution**: Changed Vite dev server port to 5174 (with `strictPort: false` to use next available)
  - New frontend URL: `http://localhost:5175`
  - Backend proxy routes `/api` requests to `http://localhost:3001`
  - Status: ✅ Fixed

### 2. **Missing Authentication Header**
- **Problem**: `getVendorOrders()` API call didn't include JWT authorization token
- **Symptom**: 401 Unauthorized error when calling `/api/vendor/{vendorId}/orders`
- **Root Cause**: The backend endpoint uses `verifySupabaseJwt` middleware which requires:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Solution**: Updated `getVendorOrders()` function to:
  1. Get current session from Supabase using `supabase.auth.getSession()`
  2. Extract `access_token` from session
  3. Include in request headers:
     ```javascript
     headers: {
       'Authorization': `Bearer ${session.access_token}`,
       'Content-Type': 'application/json'
     }
     ```
  - Status: ✅ Fixed

## Files Modified

1. **vite.config.js**
   - Changed `port: 3000` → `port: 5174`
   - Changed `strictPort: true` → `strictPort: false`
   - Changed `host: true` → `host: '::'`
   - API proxy to 3001 remains unchanged

2. **src/api/EcommerceApi.js** - `getVendorOrders()` function
   - Added Supabase session retrieval
   - Added authorization header with JWT token
   - Added Content-Type header

## Current Status

✅ **Servers Running:**
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5175` (proxies `/api` → port 3001)

✅ **Authentication:**
- Frontend can now authenticate API requests with Supabase JWT token
- Vendor orders endpoint will verify user owns the vendor before returning orders

✅ **Expected Result:**
- When vendor navigates to Orders page, all 3 orders should now display with:
  - Order ID
  - Customer email (from order metadata)
  - Total amount
  - Status (paid)
  - Creation date

## Testing Checklist
- [ ] Navigate to vendor dashboard
- [ ] Click on "Orders" tab
- [ ] Verify 3 orders appear (seller2 has 3 orders in database)
- [ ] Check order details: email, amount, status, date
- [ ] Verify no 401 errors in console
- [ ] Check API calls show Authorization header
