# Seller Onboarding Architecture Diagram

## 🎯 Two-Level Verification System

```
KYC (User-Level) = profiles.kyc_status
├─ Single verification per account
├─ Controls if user can sell globally
├─ Status: ✅ IMPLEMENTED (Dec 31, 2025)
└─ Values: 'not_started' | 'approved'

KYB (Store-Level) = vendors.onboarding_status  
├─ Individual verification per store
├─ Controls if specific store can list products
├─ Status: 🔄 READY FOR DEVELOPMENT
└─ Values: 'not_started' | 'started' | 'pending' | 'kyc_in_progress' | 'approved'
```

## Current Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. Homepage ──→ "Become Seller" Button                                      │
│                          ↓                                                   │
│  2. BecomeSellerPage ──→ Marketing & CTA                                     │
│      └─ "Sign Up to Sell" Button                                             │
│                          ↓                                                   │
│  3. SellerOnboarding     ← NO AUTH CHECK ⚠️ (NEEDS FIX)                     │
│      └─ SellerSignupForm                                                     │
│          ├─ owner_id: ??? ⚠️ MANUAL INPUT (BUG - NEEDS FIX)                 │
│          ├─ name: "My Store"                                                 │
│          ├─ slug: "my-store"                                                 │
│          ├─ website: "..."                                                   │
│          ├─ description: "..."                                               │
│          └─ contact_email: "..."                                             │
│                          ↓                                                   │
│          POST /api/onboarding/signup (NO JWT ⚠️ NEEDS FIX)                  │
│                          │                                                   │
│                          ↓                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐        │
│  │                    BACKEND (Express)                              │        │
│  ├──────────────────────────────────────────────────────────────────┤        │
│  │  /api/onboarding/signup                                          │        │
│  │  ├─ ✅ Extract owner_id, name, slug, etc.                       │        │
│  │  ├─ ✅ Generate onboarding_token (UUID)                         │        │
│  │  ├─ ✅ Create vendor row in Supabase                            │        │
│  │  ├─ ✅ Return vendor + onboardingUrl                            │        │
│  │  └─ Response: {                                                  │        │
│  │      vendor: { id, owner_id, name, slug, ... },                 │        │
│  │      onboardingUrl: "/onboarding/:token"                         │        │
│  │    }                                                              │        │
│  │                                                                   │        │
│  │  ┌──────────────────────────────────────────────────────────┐   │        │
│  │  │           SUPABASE DATABASE (PostgreSQL)                 │   │        │
│  │  ├──────────────────────────────────────────────────────────┤   │        │
│  │  │  vendors TABLE:                                          │   │        │
│  │  │  ├─ id: UUID (primary key)                              │   │        │
│  │  │  ├─ owner_id: UUID → profiles.id (FK)                   │   │        │
│  │  │  ├─ name: String                                         │   │        │
│  │  │  ├─ slug: String (unique)                               │   │        │
│  │  │  ├─ description: String                                  │   │        │
│  │  │  ├─ onboarding_status: 'started' | 'kyc_in_progress'   │   │        │
│  │  │  ├─ onboarding_token: UUID                             │   │        │
│  │  │  ├─ kyc_id: String (from KYC provider)                 │   │        │
│  │  │  ├─ created_at: Timestamp                              │   │        │
│  │  │  └─ onboarding_data: JSON (appeals, documents)         │   │        │
│  │  │                                                          │   │        │
│  │  profiles TABLE (KYC - User Level):                   │   │        │
│  │  ├─ id: UUID (from auth.users)                         │   │        │
│  │  ├─ email: String                                       │   │        │
│  │  ├─ role: 'buyer' | 'seller' | 'admin'                │   │        │
│  │  ├─ kyc_status: 'not_started' | 'approved' ✅         │   │        │
│  │  │  └─ ...                                                  │   │        │
│  │  └──────────────────────────────────────────────────────────┘   │        │
│  └──────────────────────────────────────────────────────────────────┘        │
│                          ↓                                                   │
│  Frontend receives onboardingUrl                                             │
│                          ↓                                                   │
│  4. Redirect to: /onboarding/:token                                          │
│      └─ SellerOnboarding component (with token param)                        │
│                          ↓                                                   │
│  GET /api/onboarding/:token (NO JWT ⚠️)                                     │
│      └─ Returns: { vendor: { ... } }                                         │
│                          ↓                                                   │
│  5. Display vendor info + "Start Identity Verification" button               │
│                          ↓                                                   │
│  6. User clicks button → POST /api/onboarding/start-kyc                      │
│      (REQUIRES JWT ⚠️ NEEDS FIX)                                             │
│                          │                                                   │
│                          ↓                                                   │
│  ┌──────────────────────────────────────────────────────────────┐            │
│  │  Backend: /api/onboarding/start-kyc                          │            │
│  │  ├─ ✅ Verify user owns vendor (owner_id == user.id)        │            │
│  │  ├─ ⚠️ Create KYC session (currently stubbed)              │            │
│  │  ├─ ✅ Update vendor: onboarding_status = 'kyc_in_progress'│            │
│  │  ├─ ✅ Return providerUrl                                   │            │
│  │  └─ NEEDS: Real KYC provider integration                     │            │
│  └──────────────────────────────────────────────────────────────┘            │
│                          ↓                                                   │
│  Frontend redirects to providerUrl (stub: same page with params)             │
│                          ↓                                                   │
│  7. User completes KYC (or skips in stub)                                    │
│                          ↓                                                   │
│  KYC Provider → Webhook POST /api/onboarding/webhook                         │
│      └─ Updates vendor: onboarding_status = 'kyc_completed'                  │
│                          ↓                                                   │
│  8. Seller can now access /dashboard/onboarding                              │
│      ├─ GET /api/onboarding/me (NO JWT ⚠️ NEEDS FIX)          │            │
│      ├─ Returns vendor info + counts                            │            │
│      └─ Display:                                                │            │
│          ├─ Store name                                          │            │
│          ├─ Onboarding status                                   │            │
│          ├─ Active listings                                     │            │
│          ├─ Items sold                                          │            │
│          └─ Items bought                                        │            │
│                                                                  │            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Auth Flow (What's Broken)

### Current (BROKEN) ❌
```
User (Anonymous or Logged In)
    ↓
Click "Become Seller"
    ↓
Go to /onboarding (NO PROTECTION)
    ↓
See form with owner_id input field (SECURITY BUG)
    ↓
User manually enters "owner_id" (could be anyone's ID!)
    ↓
POST /api/onboarding/signup (NO JWT)
    ↓
Backend accepts and creates vendor with that owner_id
    ↓
PROBLEM: User just created a vendor for someone else!
```

### What Should Happen (FIXED) ✅
```
Anonymous User
    ↓
See "Become Seller" → takes to /onboarding
    ↓
<ProtectedRoute> redirects to login
    ↓
User logs in
    ↓
Redirect back to /onboarding
    ↓
SellerSignupForm.jsx:
  • Get user.id from SupabaseAuthContext
  • owner_id = user.id (auto-filled, hidden)
  • Show only: name, slug, website, description, contact_email
    ↓
POST /api/onboarding/signup + JWT token in header
    ↓
Backend:
  • Verify JWT → extract user.id
  • Check owner_id == user.id (authorization check)
  • Create vendor
    ↓
✅ Only logged-in users can create vendors
✅ Each user can only create vendors for themselves
```

---

## JWT Token Flow (Missing)

### Current (BROKEN) ❌
```javascript
// No JWT being sent
fetch('/api/onboarding/me')
  // Request: { headers: { 'Content-Type': 'application/json' } }
  // Response: 401 Unauthorized (no way to verify user)
```

### What Should Happen (FIXED) ✅
```javascript
// Get token from auth context
const { session } = useContext(SupabaseAuthContext);
const token = session?.access_token;

// Send JWT in Authorization header
fetch('/api/onboarding/me', {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
// Backend verifies token, extracts user.id from JWT
// Finds vendor where owner_id == user.id
// Returns correct vendor data
```

---

## RLS Policies (Important!)

The database has RLS (Row Level Security) that should prevent users from seeing other users' vendors:

```sql
-- Vendors table RLS policy (should exist)
CREATE POLICY "Users can only see vendors they own"
  ON vendors
  FOR SELECT
  USING (owner_id = auth.uid());

-- This means:
-- - User A can ONLY see their own vendors
-- - User A CANNOT see User B's vendors
-- - Even if they guess the vendor ID, the database won't return it
```

This is **excellent protection**, but it only works if you're authenticated!

---

## Testing Path

```
1. Check .env is configured
   └─ VITE_SUPABASE_URL
   └─ SUPABASE_SERVICE_ROLE_KEY

2. Start servers
   └─ npm run dev:all

3. Test signup flow
   ├─ Create buyer account (login)
   ├─ Click "Become Seller"
   ├─ Fill form
   └─ Submit

4. Check Supabase
   └─ Look in vendors table
   └─ Confirm vendor was created
   └─ Verify owner_id matches user.id

5. Test KYC
   └─ Check if redirect works
   └─ Verify onboarding_status updated

6. Test dashboard
   └─ Go to /dashboard/onboarding
   └─ Check if vendor info loads
```

---

## Success Criteria

After fixes, this should work:

✅ Anonymous → See marketing page
✅ Anonymous + Click "Sign Up" → Redirected to login
✅ Logged in → Can access /onboarding
✅ Form is filled with user.id (hidden)
✅ Submit creates vendor in DB with correct owner_id
✅ Can view vendor in /dashboard/onboarding
✅ JWT is sent with all protected API calls
✅ Can't see other users' vendors (RLS protects)
✅ Can only modify own vendor
✅ Each user can only own one vendor (or enforce in backend)

---

## File Dependencies

```
SellerSignupForm.jsx
  ├─ needs: SupabaseAuthContext (to get user.id)
  ├─ calls: POST /api/onboarding/signup
  └─ passes: onSuccess callback

SellerOnboarding.jsx
  ├─ needs: ProtectedRoute (parent wrapper)
  ├─ needs: SupabaseAuthContext (to get JWT token)
  ├─ calls: GET /api/onboarding/:token (no JWT needed - public)
  ├─ calls: POST /api/onboarding/start-kyc (needs JWT)
  └─ uses: SellerSignupForm

OnboardingDashboard.jsx
  ├─ needs: ProtectedRoute (parent wrapper)
  ├─ needs: SupabaseAuthContext (to get JWT token)
  ├─ calls: GET /api/onboarding/me (needs JWT)
  └─ requires: vendor ownership (via RLS)

server/onboarding.js
  ├─ imports: verifySupabaseJwt middleware
  ├─ uses: supabase client
  └─ validates: owner_id matches request user
```

