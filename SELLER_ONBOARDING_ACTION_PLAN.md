# 🎯 Seller Onboarding - Quick Action Plan

**Date**: Nov 12, 2025  
**Branch**: `feature/auth-login-signup`  
**Status**: Analysis complete, ready for fixes

---

## 📋 Current Situation

### What You Have
- ✅ Supabase database (all tables set up)
- ✅ Express backend (all endpoints implemented)
- ✅ React frontend (all pages exist)
- ✅ Authentication system (Supabase Auth)

### What's Broken
- ❌ Form accepts manual owner_id (security bug)
- ❌ /onboarding route is public (should be protected)
- ❌ API calls don't send JWT token
- ⚠️ KYC provider is stubbed (expected for now)

### Answer to Your Question
> "Will I need to create a new database/backend?"

**NO.** Everything exists. Just need to fix auth bugs.

---

## 🚀 Action Plan

### Step 1: Fix SellerSignupForm (15 min)
**File**: `src/components/auth/SellerSignupForm.jsx`

**What to change**:
- Remove the owner_id input field
- Get user ID from SupabaseAuthContext
- Auto-set owner_id = user.id

**Before**:
```jsx
<input name="owner_id" value={form.owner_id} onChange={handleChange} />
```

**After**:
```jsx
import { useContext } from 'react';
import { SupabaseAuthContext } from '@/contexts/SupabaseAuthContext';

export default function SellerSignupForm({ onSuccess }) {
  const { user } = useContext(SupabaseAuthContext);
  
  if (!user) return <div>Please log in to become a seller</div>;
  
  const owner_id = user.id; // ← Use this, don't let user input it
  
  // Rest of form code...
  // Don't show owner_id in UI
  // Form submission will include owner_id automatically
}
```

---

### Step 2: Protect /onboarding Route (5 min)
**File**: `src/lib/routerConfig.jsx`

**What to change**:
- Wrap SellerOnboarding with ProtectedRoute

**Before**:
```jsx
{ path: 'onboarding', element: <SellerOnboarding /> },
{ path: 'onboarding/:token', element: <SellerOnboarding /> },
```

**After**:
```jsx
{ path: 'onboarding', element: <ProtectedRoute><SellerOnboarding /></ProtectedRoute> },
{ path: 'onboarding/:token', element: <ProtectedRoute><SellerOnboarding /></ProtectedRoute> },
```

---

### Step 3: Add JWT to SellerOnboarding (10 min)
**File**: `src/pages/SellerOnboarding.jsx`

**What to change**:
- Get JWT token from auth context
- Add Authorization header to all fetch calls

**Before**:
```javascript
fetch(`/api/onboarding/${token}`)
  .then(r => r.json())
```

**After**:
```javascript
import { useContext } from 'react';
import { SupabaseAuthContext } from '@/contexts/SupabaseAuthContext';

export default function SellerOnboarding() {
  const { session } = useContext(SupabaseAuthContext);
  const token = session?.access_token;

  // ...

  useEffect(() => {
    if (!token) return;
    fetch(`/api/onboarding/${token}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(r => r.json())
    // ...
  }, [token]);

  const startKyc = async () => {
    if (!vendor || !token) return;
    const res = await fetch('/api/onboarding/start-kyc', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ vendor_id: vendor.id })
    });
    // ...
  };
}
```

---

### Step 4: Add JWT to OnboardingDashboard (10 min)
**File**: `src/pages/OnboardingDashboard.jsx`

**What to change**:
- Same as Step 3 - add JWT to fetch call

**Before**:
```javascript
fetch('/api/onboarding/me')
  .then(r => r.json())
```

**After**:
```javascript
import { useContext } from 'react';
import { SupabaseAuthContext } from '@/contexts/SupabaseAuthContext';

export default function OnboardingDashboard() {
  const { session } = useContext(SupabaseAuthContext);
  
  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;

    fetch('/api/onboarding/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(r => r.json())
    .then(data => {
      if (data?.vendor) setVendor(data.vendor);
      else setError(data.error || 'No vendor');
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  }, [session?.access_token]);
}
```

---

### Step 5: Test End-to-End (15 min)

**Test Script**:
```
1. Go to http://localhost:3000
2. Sign up as a buyer (if not already logged in)
3. Go to /become-seller
4. Click "Sign Up to Sell"
5. Fill form (no owner_id field now):
   - Store Name: "Test Store"
   - Slug: "test-store"
   - Website: "https://example.com"
   - Description: "Test"
   - Contact Email: "test@example.com"
6. Submit
7. Should redirect to /onboarding/:token
8. Should see vendor info loaded
9. Check Supabase:
   - Go to vendors table
   - Find newly created vendor
   - Verify owner_id matches your user ID
10. Try to access /dashboard/onboarding
    - Should see vendor info and stats
```

---

### Step 6: Verify in Supabase (5 min)

**Check**:
1. Go to Supabase project
2. Open `vendors` table
3. Find your new vendor
4. Verify:
   - ✅ owner_id is your user.id (not random)
   - ✅ name is "Test Store"
   - ✅ slug is "test-store"
   - ✅ onboarding_status is "started"
   - ✅ onboarding_token is set
   - ✅ created_at has recent timestamp

---

## ⏱️ Time Estimate

| Step | Time | Status |
|------|------|--------|
| 1. Fix SellerSignupForm | 15 min | TODO |
| 2. Protect route | 5 min | TODO |
| 3. JWT in SellerOnboarding | 10 min | TODO |
| 4. JWT in OnboardingDashboard | 10 min | TODO |
| 5. Test end-to-end | 15 min | TODO |
| 6. Verify in Supabase | 5 min | TODO |
| **TOTAL** | **60 min** | |

---

## 📝 After You Fix These

Once these 4 files are fixed and working, you'll have:

✅ Secure seller registration (owner_id can't be faked)
✅ Protected routes (can't access onboarding without login)
✅ JWT authentication (backend knows who is making requests)
✅ Proper vendor creation (database validates ownership)
✅ Working dashboard (seller can see their own vendor info)

Then you can work on:
- [ ] Real KYC provider integration
- [ ] Email notifications
- [ ] Seller product management pages
- [ ] Payout system
- [ ] Advanced seller dashboard

---

## 🐛 Common Issues You Might Hit

### "user is undefined"
**Problem**: SupabaseAuthContext not imported or user not logged in
**Fix**: Check import, verify user is logged in before testing

### "401 Unauthorized"
**Problem**: JWT not being sent or JWT is invalid
**Fix**: Check Authorization header is being set, verify session.access_token exists

### "No vendor found"
**Problem**: owner_id doesn't match the logged-in user
**Fix**: Verify user.id is being used, not random owner_id

### Form won't submit
**Problem**: Missing required fields or validation error
**Fix**: Check browser console for errors, verify all required fields filled

---

## 📚 Documentation Created

I've created 4 comprehensive docs in your repo:

1. **SELLER_ONBOARDING_SUMMARY.md** ← Start here
2. **SELLER_ONBOARDING_FIXES.md** ← Detailed issues
3. **SELLER_ONBOARDING_REVIEW.md** ← Testing guide
4. **SELLER_ONBOARDING_ARCHITECTURE.md** ← Diagrams & flow

---

## 💾 Before You Start

```bash
# Make sure you're on the right branch
git branch

# Should show: * feature/auth-login-signup

# Pull latest changes
git pull origin main

# Install dependencies
npm install --ignore-scripts

# Start servers (in separate terminals)
npm run dev:all
```

---

## ✅ Commit Strategy

After each step, commit:

```bash
# After step 1
git add src/components/auth/SellerSignupForm.jsx
git commit -m "fix: Use user.id from auth context in SellerSignupForm"

# After step 2
git add src/lib/routerConfig.jsx
git commit -m "fix: Protect /onboarding route with ProtectedRoute"

# After step 3
git add src/pages/SellerOnboarding.jsx
git commit -m "fix: Add JWT authorization header to SellerOnboarding"

# After step 4
git add src/pages/OnboardingDashboard.jsx
git commit -m "fix: Add JWT authorization header to OnboardingDashboard"

# After test passes
git commit -m "test: Verify seller onboarding flow end-to-end"
```

---

**Ready to start? Pick Step 1 above and begin! 🚀**

You've got this! Any questions, refer to the detailed documentation files.

