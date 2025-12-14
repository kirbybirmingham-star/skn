# Seller Onboarding & KYC Testing Guide

## Overview

This guide provides step-by-step instructions for testing the complete seller onboarding and KYC flow, including manual UI testing and automated script testing.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Automated Testing](#automated-testing)
3. [Manual Dashboard Testing](#manual-dashboard-testing)
4. [Test All 3 Sellers](#test-all-3-sellers)
5. [Troubleshooting](#troubleshooting)
6. [Test Checklist](#test-checklist)

---

## Quick Start

### Prerequisites

- Development server running: `npm run dev`
- Backend server running: `npm start`
- Environment variables configured in `.env`
- Database access via Supabase

### 1-Minute Setup

```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Start frontend
npm run dev

# Terminal 3: Run tests
npm run seller:verify        # Verify all sellers registered
npm run test:kyc             # Run KYC flow test for Seller 2
```

---

## Automated Testing

### Available Scripts

#### 1. Verify All Sellers Registered

```bash
npm run seller:verify
```

**What it does:**
- Checks if all sellers have `role: 'vendor'` in the profiles table
- Lists each seller with their registration status
- Shows which sellers are ready for KYC testing

**Expected output:**
```
✅ Sellers with vendor role:
  1. Seller 1 (Johns General Store) - seller1@example.com
  2. Seller 2 (Janes Gadgets) - seller2@example.com
  3. Seller 3 (Test Store 4) - seller3@example.com

Registered: 3, Skipped: 0
```

---

#### 2. Test KYC Flow for Seller 2

```bash
npm run test:kyc
```

**What it does:**
- Simulates complete KYC workflow for Seller 2
- Status transitions: `not_started` → `kyc_in_progress` → `kyc_completed` → `approved`
- Stores mock verification data
- Marks vendor as active and ready to sell

**Expected output:**
```
🔍 KYC Flow Direct Test
📊 STEP 1: Check Current Vendor Status
   ✓ Vendor: Janes Gadgets
   ✓ Current Status: not_started

🚀 STEP 2: Simulate Starting KYC
   ✓ Status changed to: kyc_in_progress

... (more steps) ...

🎉 KYC Flow Test Complete!
✅ Seller 2 is now fully onboarded!
```

**Verification data created:**
- KYC Provider: mock
- Verified Name: Jane Smith
- Documents: ID + Address Proof (both verified)
- Risk Level: low
- Identity Verified: ✅
- Address Verified: ✅

---

### Running Tests in Sequence

Test the complete workflow step-by-step:

```bash
# Step 1: Verify registration
npm run seller:verify

# Step 2: Test KYC flow
npm run test:kyc

# Step 3: Verify KYC was applied
npm run seller:verify
```

---

## Manual Dashboard Testing

### Test Seller 2 Access After KYC

#### Step 1: Open Application

```
URL: http://localhost:3000
```

#### Step 2: Login as Seller 2

```
Email: seller2@example.com
Password: [Use the password from signup or: seller2@123456]
```

#### Step 3: Verify Onboarding Dashboard

Navigate to: `/dashboard/onboarding`

**Expected state:**
- ✅ Status badge shows: "Approved" (green)
- ✅ No pending items
- ✅ Documents listed as approved
- ✅ "Ready to start selling" message visible
- ✅ No action buttons (everything complete)

**What you should see:**
```
✅ Seller Onboarding Status

Status: Approved ✅ [Green Badge]

Account Setup: ✅ Complete
Verification: ✅ Verified  
Approval: ✅ Approved

Documents Verified:
- ID Document ✅
- Address Proof ✅

Risk Level: Low
Verified Name: Jane Smith

Ready to start selling! Add your first product now.
```

---

#### Step 4: Verify Vendor Dashboard

Navigate to: `/dashboard/vendor`

**Expected functionality:**
- ✅ Dashboard loads without errors
- ✅ Store name shows: "Janes Gadgets"
- ✅ Store status shows: Active
- ✅ Can access:
  - Dashboard overview
  - Products section
  - Orders section
  - Settings/Profile
- ✅ "Add Product" button is visible and clickable
- ✅ No "Awaiting Approval" messages

---

#### Step 5: Test Product Creation

1. Click "Add Product" or navigate to Products → Add New
2. Fill out a test product:
   ```
   Name: Test Gadget
   Price: $99.99
   Category: Electronics
   Description: Test product from KYC flow
   ```
3. Upload an image (optional)
4. Click "Create Product"

**Expected result:**
- ✅ Product created successfully
- ✅ Product appears in products list
- ✅ No permission errors
- ✅ Product is visible on main store page

---

### Testing All Three Sellers

#### Setup for All Sellers

First, verify all sellers are registered:

```bash
npm run seller:verify
```

Expected output:
```
✅ All sellers registered
1. Seller 1: Johns General Store
2. Seller 2: Janes Gadgets
3. Seller 3: Test Store 4
```

---

#### Seller 1: Johns General Store

**Credentials:**
```
Email: seller1@example.com
```

**Test steps:**
1. Login with seller1@example.com
2. Navigate to `/dashboard/onboarding`
3. Note the current status
4. If not approved, run KYC test (see below)

---

#### Seller 2: Janes Gadgets (Already Tested)

✅ KYC already completed via `npm run test:kyc`

**Current status:** Approved ✅

---

#### Seller 3: Test Store 4

**Credentials:**
```
Email: seller3@example.com
```

**Test steps:**
1. Login with seller3@example.com
2. Navigate to `/dashboard/onboarding`
3. Check current status
4. If not approved, KYC test needed

---

### Create KYC Tests for Other Sellers

You can create similar test scripts for Seller 1 and Seller 3:

**For Seller 1 (Johns General Store):**
```bash
# Retrieve vendor ID first
node -e "import { createClient } from '@supabase/supabase-js'; import dotenv from 'dotenv'; dotenv.config(); const s = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); (async () => { const { data } = await s.from('vendors').select('id, name').eq('name', 'Johns General Store').single(); console.log('Vendor:', data); })();"
```

Then create a custom test script similar to `test_kyc_direct.js` for that vendor.

---

## Test All 3 Sellers

### Quick Multi-Seller Test

```bash
# 1. Verify all are registered
npm run seller:verify

# 2. Test Seller 2 KYC
npm run test:kyc

# 3. Verify Seller 2 can access dashboard
# Login to browser and navigate to /dashboard/vendor

# 4. Create test products for each seller
# For each seller:
#   - Login
#   - Add a test product
#   - Verify it appears in catalog
```

---

## Troubleshooting

### Issue: Seller not registered (role not set)

```bash
# Fix
npm run seller:register
```

---

### Issue: KYC test fails with "Vendor not found"

```bash
# Check vendor exists
node -e "import { createClient } from '@supabase/supabase-js'; import dotenv from 'dotenv'; dotenv.config(); const s = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); (async () => { const { data } = await s.from('vendors').select('id, name, onboarding_status').limit(5); console.log(JSON.stringify(data, null, 2)); })();"
```

---

### Issue: Seller can't access /dashboard/vendor

**Diagnosis steps:**
1. Verify role is set to 'vendor':
   ```bash
   # Check profile.role
   node -e "import { createClient } from '@supabase/supabase-js'; import dotenv from 'dotenv'; dotenv.config(); const s = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); (async () => { const { data } = await s.from('profiles').select('user_id, email, role').eq('email', 'seller2@example.com'); console.log(data); })();"
   ```

2. Verify vendor is approved:
   ```bash
   # Check vendor onboarding_status
   node -e "import { createClient } from '@supabase/supabase-js'; import dotenv from 'dotenv'; dotenv.config(); const s = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); (async () => { const { data } = await s.from('vendors').select('id, name, onboarding_status').eq('name', 'Janes Gadgets'); console.log(data); })();"
   ```

3. Clear browser cache and re-login

---

### Issue: KYC status not updating

Check the server logs:
```bash
# Look for errors in backend logs
# Server should show: "KYC started for vendor..."
# Check onboarding.js start-kyc endpoint
```

---

### Issue: Documents showing as not verified

This is expected after KYC test - the mock data should show:
- Documents: verified ✅
- Identity: verified ✅  
- Address: verified ✅

If not showing:
1. Re-run `npm run test:kyc`
2. Clear browser cache
3. Re-login as seller

---

## Test Checklist

### Automated Testing
- [ ] Run `npm run seller:verify` - All 3 sellers registered
- [ ] Run `npm run test:kyc` - KYC flow completes for Seller 2
- [ ] Verify no errors in console/terminal
- [ ] Check database: seller 2's vendor status is "approved"

### Manual Testing - Seller 2

After running `npm run test:kyc`, login as seller2@example.com and verify:

**Onboarding Page (/dashboard/onboarding):**
- [ ] Page loads without 404 errors
- [ ] Status badge visible and shows "Approved" (green)
- [ ] Documents section shows all verified
- [ ] No pending action items
- [ ] "Ready to sell" message visible

**Vendor Dashboard (/dashboard/vendor):**
- [ ] Dashboard loads successfully
- [ ] Store name "Janes Gadgets" displays
- [ ] Store status shows "Active"
- [ ] Navigation menu works:
  - [ ] Dashboard
  - [ ] Products
  - [ ] Orders
  - [ ] Settings/Profile
- [ ] "Add Product" button visible and clickable

**Product Management:**
- [ ] Can create a new product
- [ ] Product appears in product list
- [ ] Product visible on main store page
- [ ] Can edit product details
- [ ] Can delete product

### Responsive Design
- [ ] Dashboard displays correctly on mobile
- [ ] Dashboard displays correctly on tablet
- [ ] Dashboard displays correctly on desktop

### UI/UX Elements
- [ ] Status badges use correct colors (green for approved)
- [ ] Icons render correctly
- [ ] Animations (fade-in, transitions) work smoothly
- [ ] No layout shifts or overlapping elements
- [ ] Text is readable on all screen sizes

---

## Performance Notes

**Expected timing:**
- `npm run seller:verify`: < 2 seconds
- `npm run test:kyc`: 2-5 seconds
- Manual dashboard load: < 1 second
- Product creation: < 3 seconds

**If slower:**
- Check database connection
- Verify network latency
- Clear browser cache
- Restart servers

---

## Next Steps

After all tests pass:

1. ✅ Test with Seller 1 and Seller 3
2. ✅ Test rejection workflow (create kyc_rejected status test)
3. ✅ Test appeal workflow (create appeal scenario)
4. ✅ Performance testing with multiple products
5. ✅ Load testing with concurrent sellers
6. ✅ Deploy to staging environment
7. ✅ Run production smoke tests

---

## Related Documentation

- **KYC Test Results**: `KYC_FLOW_TEST_RESULTS.md`
- **Seller Registration Fix**: `SELLER_REGISTRATION_FIX.md`
- **Implementation Details**: `IMPLEMENTATION_COMPLETE_DEC14.md`
- **Quick Start**: `QUICKSTART_UI_UX_DEC14.md`

---

## Support

If you encounter issues:

1. Check troubleshooting section above
2. Review server logs: `npm start` output
3. Check browser console for errors (F12)
4. Verify database connection in `.env`
5. Review code in relevant files:
   - Backend: `server/onboarding.js`
   - Frontend: `src/pages/OnboardingDashboard.jsx`
   - Routing: `src/App.jsx`

---

**Last Updated:** December 14, 2025  
**Test Status:** ✅ All tests passing
