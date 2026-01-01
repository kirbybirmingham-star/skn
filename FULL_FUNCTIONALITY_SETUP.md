# SKN Bridge Trade - Full Functionality Setup Guide

## Quick Start - Make It Functional

This standalone repo is now functionally equivalent to the main `skn` repo. Follow these steps to get everything working:

### Step 1: Start the Development Environment

```bash
cd C:\Users\xZeian\Documents\augment-projects\skn-main-standalone

# Run BOTH frontend and backend together
npm run dev:all
```

This command:
- Starts Express backend on http://localhost:3001
- Starts Vite frontend dev server on http://localhost:3000
- Frontend Vite proxy automatically routes `/api/*` to backend

### Step 2: Verify Backend is Running

Open another terminal and check:
```bash
curl http://localhost:3001/api/health
# Should respond with server info
```

### Step 3: Open Frontend

Navigate to: http://localhost:3000

### Step 4: Test Core Features

1. **Login** - Use seller2@example.com / password
2. **Dashboard** - Should load without errors
3. **Vendor Dashboard** - Access at /dashboard/vendor
4. **Edit Products** - Try updating a product (now fixed with PATCH endpoint)
5. **Marketplace** - Browse with filters
6. **Inventory** - Manage stock levels

---

## Architecture Overview

### Frontend (Vite React)
- **Port**: 3000
- **Entry**: src/main.jsx
- **Build**: npm run build → dist/
- **Config**: vite.config.js (with /api proxy to localhost:3001)

### Backend (Express)
- **Port**: 3001
- **Entry**: server/index.js
- **Routes**: 11 API modules mounted under /api/
- **Database**: Supabase PostgreSQL

### Frontend ↔ Backend Communication

```
Development:
Frontend (3000) 
  → /api/vendor/products/{id} (request)
  → Vite proxy routes to localhost:3001
  → Express processes at /api/vendor/products/{id}
  → Response sent back

Production:
Frontend (deployed)
  → /api/vendor/products/{id} (request)
  → Same domain (backend serves static files)
  → Express processes at /api/vendor/products/{id}
  → Response sent back
```

---

## API Endpoints Now Functional

### Vendor Routes (`/api/vendor`)
- ✅ `GET /orders` - List vendor orders
- ✅ `GET /orders/:orderId` - Get order details
- ✅ `POST /orders/:orderId/fulfill` - Mark fulfilled
- ✅ `POST /orders/:orderId/cancel` - Cancel order
- ✅ `POST /orders/:orderId/tracking` - Add tracking
- ✅ `GET /orders/analytics` - Get sales analytics
- ✅ `GET /products/top` - Top 5 products
- ✅ **NEW**: `PATCH /products/:productId` - Update product (added today)

### Other Routes
All 11 API modules are fully functional:
- `/api/paypal` - Payment processing
- `/api/onboarding` - Seller registration
- `/api/orders` - Order management
- `/api/dashboard` - Analytics
- `/api/reviews` - Product reviews
- `/api/inventory` - Stock management
- `/api/wishlist` - Favorites
- `/api/messages` - Messaging
- `/api/webhooks` - Event webhooks
- `/api/health` - Server status

---

## What Was Fixed Today

### 1. Product Update Endpoint
**Problem**: Frontend tried `/api/vendor/products/{id}` PATCH but endpoint didn't exist
**Solution**: Added `PATCH /api/vendor/products/:productId` to server/vendor.js
**Features**:
- Validates ownership (only vendor owner can update)
- Validates input data (title, price, etc.)
- Returns updated product
- Proper error handling

### 2. API URL Configuration
**Problem**: Double `/api/api` in URLs (VITE_API_URL=/api was getting `/api` appended again)
**Solution**: Fixed src/config/environment.js to detect proxy path and not double-append
**Result**: All API calls now go to correct endpoints

### 3. Marketplace Filters
**Problem**: Filter state and values mismatched
**Solution**: Fixed price range values to use consistent format (under-50, 50-200, etc.)
**Result**: Filters now work correctly

### 4. Data Update Handling
**Problem**: No validation or error handling for product/vendor updates
**Solution**: Added comprehensive validation in EcommerceApi.js functions
**Result**: Better user feedback and error messages

---

## Database & Authentication

### Supabase Setup
- **URL**: https://tmyxjsqhtxnuchmekbpt.supabase.co
- **Anon Key**: Loaded from .env.local
- **Service Role Key**: Used by backend for bypass

### Test Accounts
```
Seller (Vendor):
  Email: seller2@example.com
  Password: [check .env.local or Supabase dashboard]
  Role: vendor

Admin:
  Email: admin@example.com
  Role: admin

Buyer:
  Email: buyer@example.com
  Role: customer
```

### RLS Policies
All tables have Row Level Security enabled:
- `profiles` - Users can only access their own
- `vendors` - Owners can manage their stores
- `products` - Public read, vendor-owned write
- `orders` - Buyers see their orders, vendors see their orders
- `order_items` - Auto-restricted by order ownership

---

## Debugging Tips

### If Backend Won't Start
1. Check port 3001 is free: `netstat -ano | findstr :3001`
2. Check .env.local exists with Supabase credentials
3. Check Node.js version: `node -v` (need v18+)
4. Run: `node server/index.js` for detailed error

### If Frontend Shows `/api/api` URL
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check dist/ was rebuilt: `npm run build`

### If API Calls Fail
1. Open browser DevTools → Network tab
2. Look for failed requests
3. Check error response body
4. Verify JWT token is in Authorization header

### If Products Won't Update
1. Make sure you're logged in as vendor
2. Check the product belongs to your vendor
3. Verify no validation errors in console
4. Check server logs for detailed error message

---

## File Structure (Key Files)

```
skn-main-standalone/
├── src/
│   ├── config/environment.js      ← API URL configuration
│   ├── api/EcommerceApi.js       ← Frontend API client
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── MarketplacePage.jsx
│   │   └── vendor/
│   │       ├── Products.jsx
│   │       ├── Store.jsx
│   │       ├── Inventory.jsx
│   │       └── Orders.jsx
│   └── lib/routerConfig.jsx      ← Frontend routes
├── server/
│   ├── index.js                   ← Server entry point
│   ├── vendor.js                  ← Vendor API routes (PATCH added)
│   ├── products.js                ← Product management
│   ├── orders.js                  ← Order management
│   ├── config.js                  ← Server configuration
│   ├── middleware.js              ← Auth middleware
│   └── [other route modules]
├── .env.local                     ← Environment variables
├── vite.config.js                 ← Frontend build config
└── package.json                   ← Scripts (dev:all, etc.)
```

---

## Common Tasks

### To Edit a Product
```
1. Go to /dashboard/vendor/products
2. Find product and click Edit
3. Modify title, price, description, etc.
4. Click Save
5. Check console for success message
```

### To Add Inventory
```
1. Go to /dashboard/vendor (click Vendor Dashboard)
2. Select Inventory tab
3. Update stock quantities
4. Click Save/Update
```

### To View Orders
```
1. Go to /dashboard/vendor
2. Select Orders tab
3. View vendor's orders with status
4. Can fulfill, cancel, or add tracking
```

### To Browse Marketplace
```
1. Go to /marketplace
2. Use filters: category, price, sort
3. Click product for details
4. Add to cart
5. Checkout with PayPal
```

---

## Next Steps for Production

1. **Deploy Backend**
   - Push to Render.com or similar
   - Set VITE_API_URL to backend domain
   - Rebuild frontend for production

2. **Enable HTTPS**
   - Get SSL certificate
   - Update CORS in server/config.js
   - Update frontend URLs

3. **Performance**
   - Enable image optimization
   - Set up CDN for static assets
   - Optimize database queries

4. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor API response times
   - Track user analytics

5. **Testing**
   - Full integration test suite
   - Load testing
   - Security audit

---

## Support

If something isn't working:

1. **Check the logs**
   - Frontend: Browser console (F12)
   - Backend: Terminal where npm run dev:all is running

2. **Verify setup**
   - Backend running on 3001?
   - Frontend running on 3000?
   - .env.local has credentials?

3. **Clear cache**
   - Browser cache (Ctrl+Shift+Delete)
   - npm cache (npm cache clean --force)
   - Rebuild frontend (npm run build)

4. **Try from scratch**
   ```bash
   npm run dev:all
   # If that fails, run separately:
   node server/index.js          # Terminal 1
   npm run dev                    # Terminal 2
   ```

---

## Summary

This standalone repo is now **fully functional and equivalent to the main `skn` repo**. All APIs work, all features are available, and the design is preserved.

**Run**: `npm run dev:all` and visit http://localhost:3000

That's it! Everything should work.
