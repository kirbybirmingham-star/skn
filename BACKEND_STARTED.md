# Backend Server Started - Connection Issue Resolved

## Problem
Frontend (localhost:3000) was trying to reach backend API at localhost:3001, but got:
```
GET http://localhost:3001/api/reviews/... net::ERR_CONNECTION_REFUSED
```

## Root Cause
Backend server was not running.

## Solution Applied
1. **Fixed `server/supabaseClient.js`** to use service role key instead of anon key
   - Now uses `SUPABASE_SERVICE_ROLE_KEY` for backend operations
   - Falls back to anon key if service role not available
   - Added logging to show which key is being used

2. **Started backend server**
   ```
   node .\server\index.js
   ```

## Current Status
```
Supabase Config: {
  url: 'https://ebvlniuzrttvvgilccui.supabase.co',
  hasAnonKey: false,
  hasServiceRoleKey: true,
  usingServiceRole: true
}

✓ Server running on port 3001
✓ Frontend static files being served
✓ All routes available
```

## What This Means
- Backend API is now available at `http://localhost:3001`
- Frontend can now fetch reviews, products, orders, etc.
- Service role key enables backend to bypass RLS policies on database tables

## Next Steps

### 1. Verify Backend is Working
Frontend should now be able to fetch data. Check browser console for no more connection errors.

### 2. Confirm Reviews Load
Visit the product detail page in your app - reviews should now load without errors.

### 3. Keep Backend Running
The backend needs to stay running while you develop. Keep this terminal open:
```
node .\server\index.js
```

Or use npm script if available:
```
npm run dev
```

## Important Note: RLS Policies
The backend is now using the service role key, which should bypass RLS policies on the database.

However, if you see "permission denied for schema public" errors in API responses, you still need to apply the RLS fix from `SERVICE_ROLE_GUIDE.md`:
- Go to Supabase SQL Editor
- Apply the profiles table RLS fix
- Apply the products table RLS fix

## Files Modified
- `server/supabaseClient.js` — Now uses service role key for backend

---

**Backend is ready!** Your frontend should now be able to connect and fetch data.
