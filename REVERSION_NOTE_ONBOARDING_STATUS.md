# Reversion Note: Using Original Onboarding Status

**Date**: December 31, 2025  
**Status**: ✅ Reverted to original approach  
**Reason**: Issues encountered with new KYC implementation

---

## Changes Made

### Reverted Implementation
- **Dashboard.jsx**: Now uses `vendor.onboarding_status` instead of `profiles.kyc_status`
- **server/vendor.js**: `/api/vendor/by-owner/:ownerId` now returns just the vendor with all fields
- **EcommerceApi.jsx**: `getVendorByOwner()` continues to call backend endpoint

### Files Modified
1. **src/pages/vendor/Dashboard.jsx**
   - Removed `userStatus` state variable
   - Changed: `const onboardingStatus = userStatus?.onboarding_status`
   - To: `const onboarding_status = vendor?.onboarding_status`
   - Updated JSX condition from `{userStatus ? (` to `{vendor ? (`
   - Removed user status logging

2. **server/vendor.js** (GET /api/vendor/by-owner/:ownerId)
   - Now fetches vendor data directly with `select('*')`
   - Returns simple response: `{ vendor }`
   - No longer includes user's kyc_status in response
   - Orders by `created_at desc` to get most recent vendor

3. **Removed**: References to `profiles.kyc_status` in dashboard flow

---

## Current Status

### Dashboard Onboarding Display
```javascript
// Uses vendor's onboarding_status (store level)
const onboardingStatus = vendor?.onboarding_status || 'not_started';

// Possible values:
// - 'not_started'
// - 'started'
// - 'pending'
// - 'kyc_in_progress'
// - 'approved'
// - 'rejected'
```

### Data Flow
```
Dashboard → getVendorByOwner(userId)
  ↓
EcommerceApi calls: /api/vendor/by-owner/:ownerId
  ↓
Backend returns: { vendor: { id, name, onboarding_status, ... } }
  ↓
Frontend sets vendor state
  ↓
Dashboard displays vendor.onboarding_status
```

---

## KYC/KYB Documentation

**NOTE**: The KYC/KYB separation documentation created during this session remains valid:
- [KYC_KYB_SEPARATION.md](./KYC_KYB_SEPARATION.md) - Architecture (still valid reference)
- [QUICK_REFERENCE_KYC_KYB.md](./QUICK_REFERENCE_KYC_KYB.md) - Quick lookup
- [KYC_KYB_DOCUMENTATION_INDEX.md](./KYC_KYB_DOCUMENTATION_INDEX.md) - Navigation

**Status**: Documentation is reference-only. Implementation reverted to original approach.

---

## Next Steps

### If Issues Resolve
Continue with original `vendors.onboarding_status` approach for now

### For Future KYC Implementation
Refer to KYC documentation created earlier:
1. [KYC_KYB_SEPARATION.md](./KYC_KYB_SEPARATION.md) has full architecture
2. Implementation should use same patterns when ready
3. Sync script (sync-user-kyc-status.js) already prepared

---

**Created By**: AI Assistant  
**Session**: December 31, 2025  
**Status**: Reversion Complete ✅
