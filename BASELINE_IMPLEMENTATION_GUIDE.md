# 📋 SKN BRIDGE TRADE - BASELINE IMPLEMENTATION GUIDE

**Source**: C:\Users\xZeian\Documents\augment-projects\skn (Main Branch - Functional Reference)  
**Current**: C:\Users\xZeian\Documents\augment-projects\skn-main-standalone (Target Workspace)  
**Date**: December 30, 2025  
**Status**: Implementation in Progress

---

## 🎯 OVERVIEW: What SKN Bridge Trade Does

SKN Bridge Trade is a **local community e-commerce marketplace** that connects verified buyers and sellers with:

- **Secure Authentication**: Supabase Auth with role-based access (Customer, Vendor, Admin)
- **Seller Verification**: KYC (Know Your Customer) onboarding process
- **Product Management**: Listings with images, variants, inventory tracking
- **Order Processing**: Full order lifecycle with PayPal integration
- **Vendor Dashboards**: Analytics, inventory, order fulfillment
- **Admin Panel**: System monitoring, user management, commission control
- **Real-time Notifications**: Email and in-app updates

---

## 🏗️ CORE ARCHITECTURE

### Tech Stack
```
FRONTEND          BACKEND           DATABASE          PAYMENT/EXTERNAL
─────────────     ─────────────     ─────────────     ─────────────
React 18          Node.js Express   Supabase          PayPal SDK
Vite              Port 3001         PostgreSQL        Email Service
Tailwind CSS      JWT Auth          Row-Level Sec.    Stripe (future)
React Router      Middleware        Real-time APIs
Framer Motion     REST APIs         Storage Bucket
Radix UI          Webhook Handler   Auth System
```

### Database Structure
```
CORE TABLES
├── auth.users              - Supabase Auth users
├── profiles                - User roles, preferences
├── vendors                 - Seller accounts, KYC status
├── products                - Listings, inventory
├── order_items             - Line items per order
├── orders                  - Order metadata, shipping
├── reviews                 - Buyer feedback, ratings
├── notifications           - In-app notifications
├── email_templates         - Template management
└── payouts                 - Vendor commission handling

RELATIONSHIPS
vendor (owner_id) → user (id)
product (vendor_id) → vendor (id)
order_item (vendor_id) → vendor (id)
order_item (product_id) → product (id)
```

---

## ✅ COMPLETED FEATURES (Now in Current Workspace)

### 1. **Authentication & Authorization** ✅
- Supabase Auth integration
- JWT token handling
- Role-based access control (ProtectedRoute, RequireRole)
- Multi-step login/signup

### 2. **Seller Onboarding** ✅
- Secure form with owner_id auto-fill
- KYC provider integration (stubbed for testing)
- Onboarding status tracking
- Dashboard access after completion

### 3. **Vendor Endpoints** ✅
- Order management (GET, POST)
- Order fulfillment workflow
- Tracking number handling
- Analytics calculations
- Top products reporting

### 4. **Route Protection** ✅
- /onboarding routes protected
- /dashboard/vendor requires vendor role
- JWT headers on all API calls
- Ownership verification per request

---

## 🔧 DEBUGGING & FIX GUIDES

### Common Issues & Solutions

#### 1. **RLS (Row-Level Security) Permission Denied**
**Error**: `permission denied for schema public`
**Cause**: RLS policies too restrictive
**Fix**: Apply RLS policies from [RLS_FIX_GUIDE.md](RLS_FIX_GUIDE.md)
```sql
-- Allow public read, service role bypass, owner updates
CREATE POLICY "Everyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE 
  USING (auth.uid() = id OR auth.jwt()->>'role' = 'service_role');
```

#### 2. **Service Role Key Not Working**
**Error**: Backend can't access tables even with service_role key
**Cause**: Schema-level permissions blocked
**Fix**: Check [SERVICE_ROLE_GUIDE.md](SERVICE_ROLE_GUIDE.md) for diagnostics
```bash
node scripts/diagnose-service-role.js
```

#### 3. **Module Not Found: vendor.js**
**Error**: `Cannot find module 'server/vendor.js'`
**Cause**: Missing route handler file
**Fix**: Already created in this workspace ✅
- See [BUILD_ISSUES_FIXED.md](BUILD_ISSUES_FIXED.md)
- File: `server/vendor.js` with 7 endpoints

#### 4. **Import Path Case Sensitivity**
**Error**: `Failed to load url /src/pages/Dashboardpage.jsx`
**Cause**: File name case mismatch (Windows file system)
**Fix**: Already fixed in this workspace ✅
- Changed: `../pages/Dashboardpage` → `../pages/Dashboard`

#### 5. **Images Not Loading on Render**
**Error**: Images work locally but not on deployed site
**Cause**: Wrong Supabase URL in render.yaml or dist
**Fix**: Follow [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
```yaml
envVars:
  - key: VITE_SUPABASE_URL
    value: https://YOUR_PROJECT_ID.supabase.co
```

#### 6. **JWT Token Not Sent to Backend**
**Error**: 401 Unauthorized on protected endpoints
**Cause**: API calls missing Authorization header
**Fix**: Already implemented ✅
- See [FIXES_APPLIED_SUMMARY.md](FIXES_APPLIED_SUMMARY.md)
- All endpoints include: `headers: { 'Authorization': 'Bearer TOKEN' }`

---

## 📚 DETAILED IMPLEMENTATION AREAS

### A. User Management
**Files**: `src/contexts/SupabaseAuthContext.jsx`, `src/components/ProtectedRoute.jsx`
- Login/Signup flow
- Session persistence
- Profile updates
- Role checking

### B. Seller Onboarding
**Files**: 
- `src/components/auth/SellerSignupForm.jsx` - Form with auto owner_id
- `src/pages/SellerOnboarding.jsx` - Onboarding workflow
- `server/onboarding.js` - Backend handler
- Database: `vendors` table, `profiles.role` update

**Flow**:
1. User logs in
2. Clicks "Become Seller"
3. Fills store details (name, slug, email, website)
4. Backend creates vendor + updates profile role
5. Redirects to `/dashboard/vendor`

### C. Product Management
**Files**:
- `src/pages/vendor/Products.jsx` - List/Add/Edit products
- `server/products.js` - REST endpoints
- Database: `products` table, `product_images` table

**Endpoints**:
```
GET    /api/products?vendor_id=...&limit=20
GET    /api/products/:id
POST   /api/products                    (vendor auth required)
PATCH  /api/products/:id               (owner only)
DELETE /api/products/:id               (owner only)
```

### D. Order Management
**Files**:
- `src/pages/vendor/Orders.jsx` - Vendor order list
- `src/components/orders/VendorOrderDashboard.jsx` - Dashboard
- `server/vendor.js` - Vendor endpoints ✅
- Database: `orders`, `order_items` tables

**Vendor Endpoints** (Already Implemented ✅):
```
GET    /api/vendor/orders              (list with pagination)
GET    /api/vendor/orders/:orderId     (details)
POST   /api/vendor/orders/:orderId/fulfill      (mark fulfilled)
POST   /api/vendor/orders/:orderId/cancel       (cancel)
POST   /api/vendor/orders/:orderId/tracking     (add tracking)
GET    /api/vendor/orders/analytics    (sales data)
GET    /api/vendor/products/top        (top 5 products)
```

### E. Payment System
**Files**:
- `src/pages/PaymentPage.jsx` - Checkout
- `server/paypal-*.js` - Payment handlers (multiple files)
- Webhook handling for payment events

**PayPal Integration**:
- Client ID from env
- Order creation → Payment → Capture
- Webhook validation
- Commission calculations

### F. Dashboard & Analytics
**Files**:
- `src/pages/vendor/Dashboard.jsx` - Main vendor dashboard
- `src/pages/vendor/Index.jsx` - Vendor layout
- `server/dashboard.js` - Analytics data

**Metrics**:
- Total revenue
- Total orders
- Average order value
- Recent orders
- Product sales ranking

### G. Admin Panel
**Files**:
- `src/pages/AdminPanel.jsx` - Admin interface
- `server/admin.js` (if exists) - Admin endpoints

**Functions**:
- User management
- Platform analytics
- Commission settings
- Content moderation

### H. Notifications
**Files**:
- `server/emailService.js` - Email sending
- `server/notificationService.js` - In-app notifications
- `src/components/notifications/` - UI components

**Types**:
- Order confirmation emails
- Shipment tracking
- Payment receipts
- System alerts

---

## 🚀 QUICK START FOR DEVELOPMENT

### 1. Environment Setup
```bash
# Create .env files (copy from .example)
cp .env.example .env
cp server/.env.example server/.env

# Fill in real values:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# VITE_PAYPAL_CLIENT_ID
# etc.
```

### 2. Database Setup
```bash
# Apply RLS policies
node scripts/apply-rls-policies.js

# Run migrations if needed
node scripts/apply_migrations.js
```

### 3. Start Development
```bash
# Both frontend and backend
npm run dev:all

# Or separately:
npm run dev              # Frontend at :3000
node server/index.js    # Backend at :3001
```

### 4. Test Core Flow
```bash
# 1. Sign up as buyer
# 2. Sign up as seller (Become Seller)
# 3. Create a product
# 4. Buy product as different user
# 5. Vendor fulfills order
# 6. Check analytics
```

---

## 🔍 TESTING CHECKLIST

### Backend Health
- [ ] `npm run build` completes without errors
- [ ] `node server/index.js` starts without module errors
- [ ] All vendor endpoints return 200/401 appropriately
- [ ] JWT verification works on protected routes

### Frontend Routes
- [ ] `/` (home) loads
- [ ] `/marketplace` (product list) loads
- [ ] `/become-seller` accessible only when logged in
- [ ] `/dashboard/vendor` requires vendor role
- [ ] `/admin` requires admin role

### Seller Flow
- [ ] Sign up creates user + profile
- [ ] Become Seller creates vendor
- [ ] Can add products to store
- [ ] Dashboard shows orders/analytics
- [ ] Can fulfill orders
- [ ] Status updates reflected in UI

### Data Consistency
- [ ] Product images in Supabase Storage
- [ ] Order items linked to vendor
- [ ] Payouts calculated correctly
- [ ] Notifications sent on events

---

## 📊 Key Files Reference

### Critical Frontend
```
src/
├── contexts/SupabaseAuthContext.jsx         - Auth state management
├── components/ProtectedRoute.jsx            - Route protection
├── components/RequireRole.jsx               - Role checking
├── lib/routerConfig.jsx                     - Route definitions
├── pages/
│   ├── SellerOnboarding.jsx                 - Onboarding flow
│   ├── OnboardingDashboard.jsx              - Onboarding status
│   └── vendor/
│       ├── Index.jsx                        - Vendor layout
│       ├── Dashboard.jsx                    - Main dashboard
│       ├── Products.jsx                     - Product management
│       └── Orders.jsx                       - Order management
```

### Critical Backend
```
server/
├── index.js                                 - Server entry point
├── middleware.js                            - JWT verification
├── supabaseClient.js                        - DB connection
├── onboarding.js                            - Seller signup
├── vendor.js                                - Vendor endpoints ✅
├── products.js                              - Product CRUD
├── orders.js                                - Order handling
├── paypal-*.js                              - Payment processing
├── dashboard.js                             - Analytics
└── emailService.js                          - Notifications
```

### Database
```
supabase_migrations/
├── ... (schema setup)
└── fix_vendors_rls.sql                      - RLS policies
```

---

## 🛠️ COMMON TASKS

### Add New Product Feature
1. Add column to `products` table
2. Update `server/products.js` endpoint
3. Update `ProductDetailsPage.jsx` component
4. Test with new product creation

### Add New Vendor Metric
1. Calculate in `server/dashboard.js`
2. Add to response object
3. Update `VendorDashboard.jsx` to display
4. Test with real orders

### Deploy to Production
1. Run `npm run build` (test locally)
2. Set Render env vars
3. Push to main branch
4. Monitor Render deploy logs
5. Test on live domain

### Debug Production Issues
1. Check Render logs: https://dashboard.render.com
2. Check Supabase logs: https://app.supabase.com
3. Check browser DevTools Network tab
4. Verify env vars are set correctly
5. Check RLS policies aren't blocking access

---

## 📞 SUPPORT & REFERENCES

**All Fix Guides In This Workspace**:
- [FIXES_APPLIED_SUMMARY.md](FIXES_APPLIED_SUMMARY.md) - Security fixes
- [BUILD_ISSUES_FIXED.md](BUILD_ISSUES_FIXED.md) - Build errors
- [RECURRING_BUILD_FIXES_SUMMARY.md](RECURRING_BUILD_FIXES_SUMMARY.md) - Prevention tips
- [RLS_FIX_GUIDE.md](RLS_FIX_GUIDE.md) - Database permissions
- [SERVICE_ROLE_GUIDE.md](SERVICE_ROLE_GUIDE.md) - Backend access issues
- [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) - Deployment guide
- [DEV_SETUP.md](DEV_SETUP.md) - Local development setup

**Next Steps**:
1. Review each guide above
2. Test complete seller workflow locally
3. Deploy to Render with correct env vars
4. Monitor for RLS/permission issues
5. Iterate on features based on testing

---

**Status**: ✅ Core foundation ready for feature development
**Last Updated**: December 30, 2025
