# Seller/Vendor Onboarding Review & Testing Guide

## Current Architecture Overview

### Frontend Flow
1. **BecomeSellerPage** (`/become-seller`) - Marketing page with benefits & commission tiers
2. **SellerOnboarding** (`/onboarding` or `/onboarding/:token`) - Main onboarding component
3. **SellerSignupForm** - Form to create vendor account
4. **OnboardingDashboard** (`/dashboard/onboarding`) - Vendor dashboard during onboarding

### Backend Flow
- **Express Server** (`server/index.js`) - Main server
- **Onboarding Routes** (`server/onboarding.js`) - Handles vendor signup, KYC, webhooks
- **Supabase Database** - Stores vendor data with these key fields:
  - `id` (UUID)
  - `owner_id` (links to auth user)
  - `name` (store name)
  - `slug` (store URL slug)
  - `onboarding_status` (started, kyc_in_progress, kyc_completed, etc.)
  - `onboarding_token` (UUID for link sharing)
  - `kyc_id` (KYC provider session ID)
  - `kyc_provider` (currently "stub", should be real provider)

### Database Requirements
- ✅ `profiles` table - user profiles with role (buyer/seller/admin)
- ✅ `vendors` table - vendor/store information
- ✅ `products` table - product listings per vendor
- ✅ `orders` & `order_items` - order tracking

---

## Key Endpoints

### Public Endpoints (no auth required)
```
POST /api/onboarding/signup
  Body: { owner_id, name, slug, description, website, contact_email }
  Returns: { vendor, onboardingUrl }

GET /api/onboarding/:token
  Returns: { vendor }
  Used to retrieve vendor by onboarding token
```

### Protected Endpoints (requires JWT auth)
```
POST /api/onboarding/start-kyc
  Body: { vendor_id }
  Returns: { providerUrl, providerSessionId }
  Note: Currently stubbed, redirects to /onboarding/:token?provider=stub&session=:id

GET /api/onboarding/me
  Returns: { vendor, counts: { activeListings, itemsSold, itemsBought } }

POST /api/onboarding/:id/appeal
  Body: { reason }
  For vendors to appeal rejected KYC

POST /api/onboarding/webhook
  For KYC provider to send verification results
```

---

## Areas to Test & Potential Issues

### 1. **Authentication & Authorization**
**What to test:**
- [ ] User can create an account (buyer role)
- [ ] User can switch to seller role (or create seller account)
- [ ] Seller signup creates vendor record with correct owner_id
- [ ] JWT token is properly issued after signup
- [ ] SupabaseAuthContext properly manages auth state

**Potential Issues:**
- Role assignment might not be happening correctly
- JWT verification might be failing on protected routes
- Owner_id might not match the authenticated user

**Files to check:**
- `src/contexts/SupabaseAuthContext.jsx`
- `src/components/auth/SellerSignupForm.jsx`
- `server/middleware.js` / `server/middleware/supabaseAuth.js`

---

### 2. **Vendor Creation Flow**
**What to test:**
- [ ] SellerSignupForm submits correct data to `/api/onboarding/signup`
- [ ] Vendor record is created in Supabase
- [ ] Unique slug is generated/validated
- [ ] Onboarding token is generated and returned
- [ ] Email confirmation (if implemented)

**Potential Issues:**
- Slug validation/uniqueness might fail
- API endpoint might not be receiving correct owner_id
- Response might not be handled properly in frontend

**Files to check:**
- `src/components/auth/SellerSignupForm.jsx`
- `server/onboarding.js` (lines 23-60)
- `src/pages/SellerOnboarding.jsx`

---

### 3. **KYC/Identity Verification**
**What to test:**
- [ ] KYC provider integration (currently stubbed with "stub")
- [ ] User can click "Start Identity Verification"
- [ ] Provider session is created
- [ ] User is redirected to provider (or stub page)
- [ ] Webhook properly updates vendor onboarding_status
- [ ] Vendor can see KYC status in dashboard

**Known Issues:**
- KYC is currently stubbed - uses fake `stub-${Date.now()}` IDs
- No real KYC provider integrated (e.g., JewelHQ, Onfido, etc.)
- Webhook handler expects specific payload format

**Implementation needed:**
- Integrate with real KYC provider (see KYC_PROVIDER env var)
- Test webhook endpoint `/api/onboarding/webhook`
- Handle KYC rejection/approval flows

**Files to check:**
- `server/onboarding.js` (lines 82-120 for KYC logic)
- Environment variables: `KYC_PROVIDER`, `FRONTEND_URL`

---

### 4. **Vendor Dashboard**
**What to test:**
- [ ] Seller can access `/dashboard/onboarding`
- [ ] Vendor info loads from `/api/onboarding/me`
- [ ] Active listings count is accurate
- [ ] Items sold count is accurate
- [ ] Items bought count is accurate
- [ ] Onboarding status is displayed correctly

**Potential Issues:**
- Dashboard might not be loading vendor data
- Counts might be incorrect if order/product relations are broken
- User might see other vendors' data (auth issue)

**Files to check:**
- `src/pages/OnboardingDashboard.jsx`
- `server/onboarding.js` (lines 124-176 for /me endpoint)

---

### 5. **Seller Product Management**
**What to test:**
- [ ] Seller can create products
- [ ] Products are assigned to correct vendor
- [ ] Products only show for correct vendor in StorePage
- [ ] Vendor can edit/delete own products
- [ ] Vendor cannot edit other vendors' products

**Files to check:**
- `src/pages/vendor/Products.jsx` (if exists)
- `src/api/EcommerceApi.js` (createProduct, updateProduct)
- `src/pages/StorePage.jsx` (vendor filtering)

---

### 6. **Database Relationships**
**Critical relationships to verify:**
- [ ] `vendors.owner_id` → `profiles.id` (foreign key)
- [ ] `products.vendor_id` → `vendors.id` (foreign key)
- [ ] `order_items.vendor_id` → `vendors.id` (foreign key)
- [ ] RLS (Row Level Security) policies allow vendors to see only their own data

**Potential Issues:**
- RLS policies might be too restrictive or too permissive
- Foreign key constraints might not be properly defined
- Cascading deletes might cause data loss

**Files to check:**
- `supabase_migrations/` - check migration files for RLS policies
- `RLS_FIX_GUIDE.md` - might have already documented RLS fixes

---

### 7. **Payment & Payouts** (Seller Earnings)
**What to test:**
- [ ] Commission rates are correctly deducted from seller earnings
- [ ] Payout calculations are accurate
- [ ] Sellers can request payouts
- [ ] Payout status is tracked

**Files to check:**
- `server/paypal-payouts.js`
- `server/commission-payouts.js` (if exists)
- `src/pages/vendor/Payouts.jsx` (if exists)

---

## Quick Testing Checklist

### Before Testing:
- [ ] Ensure `.env` has `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Database is seeded with test data
- [ ] Backend server is running (`npm start` or `npm run dev:all`)
- [ ] Frontend is running (`npm run dev`)

### Test Sequence:
1. **Buyer Registration**: Go to signup, create buyer account
2. **Seller Registration**: Go to `/become-seller` → "Sign Up to Sell" → fill form
3. **Check DB**: Verify vendor was created in Supabase
4. **Onboarding**: Click links in onboarding email/page
5. **KYC**: Try to start identity verification (will be stubbed)
6. **Dashboard**: Go to `/dashboard/onboarding` and check vendor info

---

## Common Fixes Needed

### Issue: "No vendor found" on OnboardingDashboard
**Cause**: `/api/onboarding/me` not finding vendor by owner_id
**Fix**: Check if JWT is being verified correctly and owner_id is set

### Issue: Seller can't create products
**Cause**: vendor_id not being set correctly or RLS policy blocking
**Fix**: Check if seller is authenticated and has correct vendor assigned

### Issue: Counts are all 0 on dashboard
**Cause**: Vendor just created, no orders/products yet
**Fix**: This is expected; seed test data or create test products

### Issue: KYC redirect not working
**Cause**: Stubbed KYC provider
**Fix**: Either integrate real KYC provider or add `/onboarding/:token?provider=stub` route

---

## Next Steps

1. **Run current flow** - Create a test seller account and note any errors
2. **Check Supabase RLS** - Verify policies allow vendors to see own data
3. **Test all endpoints** - Use Postman/Thunder Client to hit API endpoints
4. **Integrate real KYC** - Replace stub provider with actual service
5. **Add seller dashboard pages** - Create `/vendor/dashboard` with full management UI
6. **Setup email notifications** - Add onboarding status emails to sellers
7. **Add payout features** - Build out payout request/tracking UI

---

## Related Documentation
- `README-SUPABASE.md` - Supabase setup
- `RLS_FIX_GUIDE.md` - Row Level Security policies
- `RENDER_DEPLOYMENT.md` - Production deployment

