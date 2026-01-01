# KYC vs KYB Separation Architecture

**Date**: December 31, 2025  
**Status**: Documented & Implemented  
**Last Updated**: Post user-level onboarding sync

---

## 🎯 Core Concept

The system separates **user-level compliance (KYC)** from **store-level compliance (KYB)**:

| Aspect | KYC (Know Your Customer) | KYB (Know Your Business) |
|--------|-------------------------|-------------------------|
| **What It Is** | User account verification | Individual store verification |
| **Who Gets It** | All users who want to sell | Each vendor/store they create |
| **Database Field** | `profiles.kyc_status` | `vendors.onboarding_status` |
| **Responsibility** | Account owner (person) | Store owner (business entity) |
| **Values** | `not_started`, `approved` | `not_started`, `started`, `pending`, `kyc_in_progress`, `approved` |
| **Current Status** | ✅ Implemented & Synced | 🔄 Ready for implementation |

---

## 📊 Data Model

### KYC - User Level (profiles table)

```sql
-- profiles table
id UUID PRIMARY KEY
email VARCHAR
role VARCHAR ('buyer' | 'seller' | 'admin')
kyc_status VARCHAR (
  'not_started'   -- User hasn't started verification
  'approved'      -- User verified and can sell
)
created_at TIMESTAMP
updated_at TIMESTAMP

-- Example:
Jane Smith
├─ id: 123e4567-e89b-12d3-a456-426614174000
├─ email: jane@example.com
├─ role: seller
├─ kyc_status: approved           ← User verified
└─ can_sell: YES (globally)
```

### KYB - Store Level (vendors table)

```sql
-- vendors table
id UUID PRIMARY KEY
owner_id UUID (FK → profiles.id)
name VARCHAR
slug VARCHAR
description TEXT
onboarding_status VARCHAR (
  'not_started'      -- Store hasn't started verification
  'started'          -- Store verification begun
  'pending'          -- Awaiting documents
  'kyc_in_progress'  -- Verification in progress
  'approved'         -- Store verified and can sell
)
onboarding_token UUID
kyc_id VARCHAR (from KYC provider)
created_at TIMESTAMP
updated_at TIMESTAMP

-- Example:
Jane's Gadgets Store
├─ id: 223f4567-e89b-12d3-a456-426614174111
├─ owner_id: 123e4567-e89b-12d3-a456-426614174000 (Jane Smith)
├─ name: Jane's Gadgets
├─ slug: janes-gadgets
├─ onboarding_status: approved    ← Store verified
└─ can_sell_in_this_store: YES
```

---

## 🔄 Relationship & Data Flow

```
┌─────────────────────────────────────────────────────┐
│                  USER (profiles table)                │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Jane Smith                                      │ │
│  │ id: 123e4567-e89b-12d3-a456-426614174000      │ │
│  │ kyc_status: approved                          │ │
│  │ role: seller                                   │ │
│  └─────────────────────────────────────────────────┘ │
│              ↓ can own multiple ↓                     │
└─────────────────────────────────────────────────────┘
                       ↓
        ┌──────────────┴──────────────┐
        ↓                             ↓
   ┌──────────────┐          ┌──────────────┐
   │  STORE 1     │          │  STORE 2     │
   ├──────────────┤          ├──────────────┤
   │ Jane's       │          │ Jane's       │
   │ Gadgets      │          │ Vintage      │
   │ Store        │          │ Clothes      │
   │              │          │              │
   │ status:      │          │ status:      │
   │ approved     │          │ not_started  │
   │ (can sell)   │          │ (cannot sell)│
   └──────────────┘          └──────────────┘
```

**Key Insight**: Jane has KYC approval (user level) but only 1 of her 2 stores has KYB approval.

---

## ✅ Current Implementation Status

### KYC Implementation (COMPLETE) ✅

**What We Did**:
1. Added `kyc_status` field to `profiles` table (enum: `not_started`, `approved`)
2. Created `sync-user-kyc-status.js` script to migrate existing vendor statuses
3. Synced 3 users with vendors from their vendor onboarding_status:
   - Jane Smith: approved
   - John Doe: kyc_in_progress → approved
   - ADMINISTRATOR: approved
4. Updated Dashboard to display `kyc_status` instead of vendor's `onboarding_status`
5. Backend endpoint `/api/vendor/by-owner/:ownerId` returns user's kyc_status

**Current State**:
- ✅ KYC data in database (seeded)
- ✅ Dashboard displays user KYC status
- ✅ Backend provides KYC status to frontend
- ✅ Users can see their verification progress at account level

### KYB Implementation (READY) 🔄

**What Exists**:
1. `vendors.onboarding_status` field with full enum
2. Backend endpoints in `server/onboarding.js`:
   - `POST /api/onboarding/signup` - Create vendor
   - `GET /api/onboarding/:token` - Get vendor by token
   - `POST /api/onboarding/start-kyc` - Start store verification
   - `POST /api/onboarding/webhook` - KYC provider callback

**What Needs Work**:
1. Per-store verification flow (currently stubbed)
2. Real KYC provider integration for store-level verification
3. Store dashboard showing individual store status
4. Per-store compliance checks

**Documented In**: `SELLER_ONBOARDING_*.md` files

---

## 🎯 User Journey with KYC/KYB Separation

### Phase 1: Account Creation (KYC)

```
User Signs Up
    ↓
Creates account (profiles.role = 'seller')
    ↓
kyc_status = 'not_started'
    ↓
[User completes identity verification]
    ↓
kyc_status = 'approved'  ← NOW AUTHORIZED TO CREATE STORES
```

**Dashboard Shows**: "Account Verified ✅"

### Phase 2: Create Store (KYB Begins)

```
User clicks "Create Store"
    ↓
POST /api/onboarding/signup (with JWT)
    ↓
Creates vendor (onboarding_status = 'not_started')
    ↓
Vendor created but inactive (can't list products yet)
```

**Dashboard Shows**: "Store: Not Verified"

### Phase 3: Store Verification (KYB)

```
User clicks "Verify Store"
    ↓
POST /api/onboarding/start-kyc (with JWT)
    ↓
onboarding_status = 'kyc_in_progress'
    ↓
Redirect to KYC provider
    ↓
[User completes store verification]
    ↓
onboarding_status = 'approved'  ← NOW CAN LIST PRODUCTS IN THIS STORE
```

**Dashboard Shows**: "Store Verified ✅"

### Phase 4: Multi-Store Management

```
User wants another store
    ↓
Clicks "Create Another Store"
    ↓
Creates vendor #2 (separate KYB process)
    ↓
Can have:
  ├─ Store 1: approved (verified)
  ├─ Store 2: not_started (needs verification)
  └─ Store 3: kyc_in_progress (in progress)
```

---

## 📋 Database Validation Rules

### KYC Requirements for User

```sql
-- User can only sell if:
SELECT *
FROM profiles p
WHERE p.role = 'seller'
  AND p.kyc_status = 'approved'
```

### KYB Requirements for Store

```sql
-- Store can only list products if:
SELECT *
FROM vendors v
WHERE v.onboarding_status = 'approved'
  AND v.owner_id = $1  -- User owns the store
```

### Product Visibility Rule

```sql
-- Product visible only if:
SELECT p.*
FROM products p
JOIN vendors v ON p.vendor_id = v.id
WHERE v.onboarding_status = 'approved'  -- Store verified
  AND v.owner_id IN (
    SELECT id FROM profiles 
    WHERE kyc_status = 'approved'        -- Owner verified
  )
```

---

## 🔐 RLS (Row-Level Security) Implementation

### Current RLS Setup

```sql
-- KYC RLS: Users can only see their own kyc_status
CREATE POLICY "Users see own kyc_status"
  ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- KYB RLS: Users can only see vendors they own
CREATE POLICY "Users see own vendors"
  ON vendors
  FOR SELECT
  USING (owner_id = auth.uid());
```

### What This Protects

- ✅ User A cannot see User B's KYC status
- ✅ User A cannot see User B's stores
- ✅ User A cannot edit User B's store information
- ✅ User A can only list products from verified stores

---

## 📊 Frontend Display by Page

### Dashboard (`src/pages/vendor/Dashboard.jsx`)

**Displays**: User's KYC status (personal verification)

```javascript
// Current implementation
const onboardingStatus = userStatus?.onboarding_status || 'not_started';
// Shows: "Account Status: Approved" or "Not Started"
// This is KYC (user level)
```

**Should Display**:
- User's KYC status (top of page)
- List of user's stores with each store's KYB status
- Percentage of stores verified

### Store Dashboard (Future)

**Should Display**: Individual store's KYB status

```javascript
// Future implementation
const storeStatus = vendor?.onboarding_status;
// Shows: "Store Verification: Approved" or "Pending"
// This is KYB (store level)
```

---

## 🔄 Data Synchronization

### Current Sync Status

**What We Synced**:
```
vendor.onboarding_status → profiles.kyc_status
(Store-level status → User-level status)
```

**Status Mapping**:
```javascript
const mapStatusToKycStatus = (vendorStatus) => {
  if (vendorStatus === 'approved') return 'approved';
  if (['kyc_in_progress', 'pending', 'started'].includes(vendorStatus)) 
    return 'approved';  // Any progress = approved
  return 'not_started';
};
```

**Results**:
- Jane Smith: vendor approved → kyc_status approved ✅
- John Doe: vendor kyc_in_progress → kyc_status approved ✅
- ADMINISTRATOR: vendor approved → kyc_status approved ✅
- 3 users without vendors: skipped (no change needed) ✅

---

## 🚀 Implementation Roadmap

### Phase 1: KYC (COMPLETE) ✅
- [x] Database field added
- [x] Data synced
- [x] Dashboard displays KYC status
- [x] Backend returns KYC status

### Phase 2: KYB (READY FOR DEVELOPMENT)
- [ ] Per-store verification flow
- [ ] KYC provider integration for stores
- [ ] Store-level dashboard
- [ ] Product visibility checks by store status

### Phase 3: Multi-Store Management
- [ ] User can create multiple stores
- [ ] Each store has independent KYB status
- [ ] Dashboard shows all stores with their statuses
- [ ] Sellers can manage products per store

### Phase 4: Compliance & Risk Management
- [ ] Risk scoring per store
- [ ] Automated compliance checks
- [ ] Document management per store
- [ ] Audit trails for KYB changes

---

## 🎓 Key Takeaways

### For Developers

1. **KYC = User-centric**: One per account, determines if user can sell globally
2. **KYB = Store-centric**: One per vendor, determines if that specific store can list products
3. **Separate flows**: KYC completion doesn't grant store permissions
4. **Database design**: Both statuses stored in different tables by design
5. **Frontend display**: Dashboard shows KYC (user level), store pages show KYB (store level)

### For Product Team

1. **User journey**: Signup → KYC verification → Create store → KYB verification → Can sell
2. **Multiple stores**: Users can create multiple stores, each needs separate verification
3. **Compliance**: Provides two levels of checks (person + business)
4. **Risk reduction**: Can disable store without disabling user's account
5. **Flexibility**: Users can have mixed states (verified person, unverified store)

### For Business

1. **Regulatory compliance**: Separate user and business verification
2. **Risk management**: Can restrict individual stores while keeping user active
3. **Scalability**: Supports multi-vendor marketplace growth
4. **Audit trail**: Clear record of what was verified and when
5. **Expansion ready**: Can add more verification layers per store (tax ID, insurance, etc.)

---

## 📚 Related Documentation

- **[SELLER_ONBOARDING_ARCHITECTURE.md](./SELLER_ONBOARDING_ARCHITECTURE.md)**: KYB flow diagrams
- **[SELLER_ONBOARDING_GUIDE.md](./SELLER_ONBOARDING_GUIDE.md)**: Implementation issues
- **[Dashboard.jsx](./src/pages/vendor/Dashboard.jsx)**: Frontend displaying KYC
- **[server/vendor.js](./server/vendor.js)**: Backend returning KYC status

---

## ❓ FAQ

**Q: Can a user with KYC approval sell immediately?**  
A: No. They need to create a store (KYB) and get that store approved first.

**Q: Can different stores have different verification statuses?**  
A: Yes. User A could have Store 1 approved and Store 2 pending.

**Q: What happens if KYC is revoked?**  
A: User cannot create new stores, but existing approved stores can still operate (depends on policy).

**Q: Can KYB be revoked independently?**  
A: Yes. A store can be suspended without affecting user's KYC status.

**Q: Why are there two different statuses?**  
A: Regulatory compliance requires verifying both the person (KYC) and the business (KYB).

---

**Status**: ✅ Implemented & Documented  
**Last Review**: December 31, 2025
