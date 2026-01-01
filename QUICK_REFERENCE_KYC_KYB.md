# Quick Reference: KYC vs KYB

**Print this page for quick lookup during development**

---

## At a Glance

| Feature | KYC | KYB |
|---------|-----|-----|
| **Full Name** | Know Your Customer | Know Your Business |
| **Level** | User/Account | Store/Vendor |
| **Database** | `profiles.kyc_status` | `vendors.onboarding_status` |
| **Quantity** | 1 per user | 1 per store (user can have many) |
| **Purpose** | Verify person identity | Verify business legitimacy |
| **Status** | ✅ Implemented | 🔄 Ready for dev |
| **Possible Values** | `not_started`, `approved` | `not_started`, `started`, `pending`, `kyc_in_progress`, `approved` |
| **Who Does It** | User completes once | User completes per store |
| **What It Unlocks** | Ability to create stores | Ability to list products in that store |

---

## Code Locations

### KYC (User Level)

**Database**:
```sql
-- Check user's KYC status
SELECT kyc_status FROM profiles WHERE id = $1;
-- Returns: 'not_started' or 'approved'
```

**Frontend** (`src/pages/vendor/Dashboard.jsx`):
```javascript
const onboardingStatus = userStatus?.onboarding_status;
// Displays user's KYC status at dashboard
```

**Backend** (`server/vendor.js`):
```javascript
GET /api/vendor/by-owner/:ownerId
// Returns: { user: { kyc_status }, vendor: {} }
```

### KYB (Store Level)

**Database**:
```sql
-- Check store's KYB status
SELECT onboarding_status FROM vendors WHERE id = $1;
-- Returns: 'not_started', 'started', 'pending', 'kyc_in_progress', 'approved'
```

**Frontend** (Future - `src/pages/vendor/StoreSettings.jsx`):
```javascript
const storeStatus = vendor?.onboarding_status;
// Will display individual store's KYB status
```

**Backend** (`server/onboarding.js`):
```javascript
POST /api/onboarding/signup // Create store (KYB starts)
POST /api/onboarding/start-kyc // Begin store verification
```

---

## User Journey

```
┌─────────────────────────────────────────────┐
│  STEP 1: Sign Up                            │
│  User creates account                       │
│  kyc_status = 'not_started'                 │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│  STEP 2: Complete KYC                       │
│  User verifies identity                     │
│  kyc_status = 'approved' ✅                 │
└────────────────┬────────────────────────────┘
                 ↓
        ┌────────────────────┐
        │ CAN NOW:           │
        │ - Create stores    │
        │ - List products    │
        └────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│  STEP 3: Create First Store                 │
│  User creates Store #1                      │
│  Store onboarding_status = 'not_started'    │
└────────────────┬────────────────────────────┘
                 ↓
        ┌────────────────────┐
        │ CANNOT YET:        │
        │ - List products    │
        │ - Get payments     │
        └────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│  STEP 4: Complete Store Verification        │
│  User verifies Store #1                     │
│  Store onboarding_status = 'approved' ✅    │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│  STEP 5: Can Sell In Store #1               │
│  - Create products                          │
│  - Receive orders                           │
│  - Get paid                                 │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│  STEP 6: Create Second Store (Optional)     │
│  User creates Store #2                      │
│  Store onboarding_status = 'not_started'    │
│  (Repeat Steps 4-5 for new store)           │
└─────────────────────────────────────────────┘
```

---

## Key Rules

### KYC Rules
✅ User can only have ONE kyc_status  
✅ kyc_status is shared across all user's stores  
✅ User MUST have kyc_status = 'approved' to create stores  
❌ User cannot sell if kyc_status = 'not_started'  

### KYB Rules
✅ Each store has its own onboarding_status  
✅ User can create multiple stores  
✅ Each store needs independent verification  
❌ Store cannot list products unless onboarding_status = 'approved'  

### Combined Rules
✅ User with kyc_status = 'approved' can create unlimited stores  
❌ Even with kyc_status = 'approved', each store must be verified (KYB)  
✅ User can have 1 store verified + 1 store pending + 1 store new  
❌ Cannot create store if kyc_status = 'not_started'  

---

## Current Implementation (Dec 31, 2025)

### What's Done ✅
- [x] `profiles.kyc_status` field exists
- [x] KYC data synced to database (3 users updated)
- [x] Dashboard displays user's KYC status
- [x] Backend returns KYC status to frontend
- [x] RLS policies protect user privacy

### What's Ready 🔄
- [x] `vendors.onboarding_status` field exists
- [x] Backend endpoints documented
- [x] Data flow designed
- [x] Architecture documented
- [ ] Frontend KYB flow implementation
- [ ] KYC provider integration for stores

### What's Future 🚀
- [ ] Per-store dashboard
- [ ] Multi-store management UI
- [ ] Real KYC provider integration
- [ ] Risk scoring per store
- [ ] Compliance document management

---

## Common Questions

**Q: Can user with kyc_status = 'not_started' create a store?**  
A: No. Dashboard prevents store creation until user is KYC approved.

**Q: Can user with KYC approved but store not verified list products?**  
A: No. Each store must have `onboarding_status = 'approved'` to list products.

**Q: Can one user have multiple stores in different verification states?**  
A: Yes. User can have Store A (approved), Store B (pending), Store C (not started).

**Q: What happens if user's KYC is revoked?**  
A: User cannot create new stores, but existing verified stores can continue operating.

**Q: What happens if store's KYB is revoked?**  
A: Only that store is affected. User's other stores and KYC status remain unchanged.

**Q: Why two levels instead of one?**  
A: Regulatory compliance requires verifying both the person and the business entity.

---

## Database Queries

### Check User's KYC Status
```sql
SELECT kyc_status FROM profiles WHERE id = $userId;
```

### Check Store's KYB Status
```sql
SELECT onboarding_status FROM vendors WHERE id = $storeId;
```

### Get All Stores for a User
```sql
SELECT * FROM vendors WHERE owner_id = $userId;
```

### Check if User Can Create Products
```sql
SELECT v.id, v.onboarding_status
FROM vendors v
JOIN profiles p ON v.owner_id = p.id
WHERE v.owner_id = $userId
  AND p.kyc_status = 'approved'
  AND v.onboarding_status = 'approved';
```

### Check if User Can See Store
```sql
SELECT * FROM vendors 
WHERE owner_id = $userId 
  AND id = $storeId;
-- Returns result only if user owns the store (RLS enforced)
```

---

## API Endpoints

### KYC Related
```
GET /api/vendor/by-owner/:ownerId
├─ Returns: { user: { kyc_status, ... }, vendor: { ... } }
├─ Checks: Is user authenticated?
└─ Uses: Service role (no RLS needed for self)
```

### KYB Related
```
POST /api/onboarding/signup
├─ Creates: New vendor (store)
├─ Sets: onboarding_status = 'not_started'
└─ Requires: JWT + kyc_status = 'approved' (business logic check)

POST /api/onboarding/start-kyc
├─ Updates: onboarding_status = 'kyc_in_progress'
├─ Starts: Store verification
└─ Requires: JWT + Ownership of vendor

POST /api/onboarding/webhook (from KYC provider)
├─ Updates: onboarding_status = 'approved'
└─ Triggered: When store verification completes
```

---

## Testing Checklist

### KYC Testing ✅
- [x] Dashboard shows user's kyc_status
- [x] Status matches database value
- [x] Data synced correctly from migration script
- [ ] KYC flow end-to-end (not yet implemented)

### KYB Testing 🔄
- [ ] User can create store with kyc_status = 'approved'
- [ ] Store starts with onboarding_status = 'not_started'
- [ ] User cannot list products until store is 'approved'
- [ ] User with multiple stores shows all statuses
- [ ] KYB webhook updates status correctly
- [ ] Store-level dashboard shows correct status

### Security Testing
- [ ] User cannot see other user's kyc_status (RLS)
- [ ] User cannot see other user's vendors (RLS)
- [ ] User cannot modify other user's onboarding_status
- [ ] JWT verification on all protected endpoints
- [ ] Service role used only in backend, never exposed

---

**Reference**: [KYC_KYB_SEPARATION.md](./KYC_KYB_SEPARATION.md) for full documentation
