# Seller Onboarding - Critical Issues Found

## 🚨 Critical Issues

### 1. **owner_id is manually entered (MAJOR BUG)**
**Location**: `src/components/auth/SellerSignupForm.jsx`

**Problem**: 
- Form allows user to manually input `owner_id` instead of using authenticated user ID
- This allows users to create vendors for other people's accounts
- Security vulnerability - no authorization check

**Current Flow**:
```jsx
<input name="owner_id" value={form.owner_id} onChange={handleChange} />
```

**Should Be**:
```jsx
// Get owner_id from authenticated user context, not from form input
const { user } = useContext(SupabaseAuthContext); // or similar
const owner_id = user?.id;
// Don't show this field to user
```

**Fix Priority**: 🔴 CRITICAL - Do this first

---

### 2. **No auth requirement to access /onboarding**
**Location**: `src/pages/SellerOnboarding.jsx` and `src/lib/routerConfig.jsx`

**Problem**:
- Path `/onboarding` is not protected (no ProtectedRoute wrapper)
- Anyone can access onboarding page without logging in
- Anonymous users can try to create vendor accounts

**Current**:
```jsx
{ path: 'onboarding', element: <SellerOnboarding /> },  // ❌ Not protected
```

**Should Be**:
```jsx
{ path: 'onboarding', element: <ProtectedRoute><SellerOnboarding /></ProtectedRoute> },
```

**Fix Priority**: 🔴 CRITICAL - Do this immediately

---

### 3. **SupabaseAuthContext not being used**
**Location**: `src/components/auth/SellerSignupForm.jsx`

**Problem**:
- Form doesn't use any context to get authenticated user
- No checks for whether user is logged in
- No role checking (should be "seller" role)

**Should Add**:
```jsx
import { useContext } from 'react';
import { SupabaseAuthContext } from '@/contexts/SupabaseAuthContext';

export default function SellerSignupForm({ onSuccess }) {
  const { user } = useContext(SupabaseAuthContext);
  
  // Redirect if not authenticated
  if (!user) {
    return <div>Please log in to become a seller</div>;
  }

  // Use user.id instead of form input
  const owner_id = user.id;
  
  // Rest of form...
}
```

**Fix Priority**: 🔴 CRITICAL

---

### 4. **JWT not being sent with protected endpoints**
**Location**: `src/pages/SellerOnboarding.jsx` and `src/pages/OnboardingDashboard.jsx`

**Problem**:
- Fetch calls don't include Authorization header with JWT
- Protected endpoints like `/api/onboarding/me` won't authenticate user

**Current**:
```javascript
fetch('/api/onboarding/me')  // ❌ No auth header
  .then(r => r.json())
```

**Should Be**:
```javascript
const { session } = useContext(SupabaseAuthContext);
const token = session?.access_token;

fetch('/api/onboarding/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

**Fix Priority**: 🔴 CRITICAL - Endpoints will return 401 errors

---

### 5. **KYC is fully stubbed**
**Location**: `server/onboarding.js` lines 104-120

**Problem**:
- KYC provider integration is hardcoded stub
- Uses fake `stub-${Date.now()}` session IDs
- No real verification happening

**Current**:
```javascript
const providerSessionId = `stub-${Date.now()}`;
const { error: updErr } = await supabase
  .from('vendors')
  .update({ kyc_provider: process.env.KYC_PROVIDER || 'stub', kyc_id: providerSessionId, onboarding_status: 'kyc_in_progress' })
```

**Fix Priority**: 🟡 HIGH - Needed for production, but can use stub for testing

---

## Summary of What Needs to Work

### Ideal Seller Signup Flow:
1. **Buyer logs in first** ✅ (Need to verify this works)
2. **Buyer clicks "Become Seller"**
3. **Fill seller form** (NEEDS FIXES):
   - ✅ Store Name
   - ✅ Slug
   - ✅ Website
   - ✅ Description
   - ✅ Contact Email
   - ❌ owner_id (MUST be auto-filled from user, not manual input)
4. **Backend creates vendor** (NEEDS JWT):
   - ✅ POST /api/onboarding/signup receives owner_id ✅
   - ✅ Creates vendor record in DB
   - ✅ Generates onboarding_token
   - ✅ Returns onboardingUrl
5. **Redirect to KYC** 
   - ❌ Currently stubbed, redirects to `/onboarding/:token?provider=stub`
6. **Vendor dashboard**
   - ❌ NEEDS JWT in Authorization header to work

---

## Database - Do NOT Need New Backend/Database

**You already have:**
- ✅ Supabase PostgreSQL database
- ✅ `profiles` table with role field
- ✅ `vendors` table with onboarding fields
- ✅ `products`, `orders`, `order_items` tables
- ✅ Express backend server
- ✅ Authentication with Supabase Auth

**You do NOT need to:**
- ❌ Create new database
- ❌ Create new backend server
- ❌ Change database schema (unless RLS policies need fixing)

**You DO need to:**
- ✅ Fix the frontend form to use authenticated user
- ✅ Add JWT authentication headers to API calls
- ✅ Protect `/onboarding` route with ProtectedRoute
- ✅ Integrate real KYC provider (or keep stub for testing)
- ✅ Test all endpoints with proper auth

---

## Quick Fix Roadmap

### MUST DO FIRST (Session 1 - Critical):
1. Fix `SellerSignupForm` to get owner_id from user context
2. Protect `/onboarding` route with `<ProtectedRoute>`
3. Add JWT auth header to all fetch calls
4. Test seller signup flow end-to-end

### SHOULD DO (Session 2 - Important):
5. Test `/api/onboarding/me` endpoint with proper auth
6. Fix vendor counts if they're wrong
7. Create test seller accounts and verify data in Supabase
8. Test product creation by seller

### CAN DO LATER (Session 3 - Nice to have):
9. Integrate real KYC provider
10. Setup email notifications
11. Build seller dashboard pages
12. Add payout features

---

## Files to Edit

### Priority 1 (Fix Authentication):
- [ ] `src/components/auth/SellerSignupForm.jsx` - Use user context, remove owner_id input
- [ ] `src/lib/routerConfig.jsx` - Wrap SellerOnboarding with ProtectedRoute
- [ ] `src/pages/SellerOnboarding.jsx` - Add JWT to fetch calls
- [ ] `src/pages/OnboardingDashboard.jsx` - Add JWT to fetch calls

### Priority 2 (Verify Endpoints):
- [ ] `server/onboarding.js` - Review and test all endpoints
- [ ] `server/middleware/supabaseAuth.js` - Verify JWT verification works
- [ ] Check RLS policies in Supabase (review `RLS_FIX_GUIDE.md`)

