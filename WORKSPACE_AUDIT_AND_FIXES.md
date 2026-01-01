# 🔍 Workspace Architecture Audit & Fix Plan

**Date:** December 31, 2025 (Post-error review)  
**Focus:** User & Vendor Dashboards - Read/Update Data Flow  
**Status:** IN PROGRESS

---

## Critical Architecture Rule Violation Detected

### ❌ Issue #1: Frontend Direct Supabase Calls Still Present

**Violation:** Some components still call Supabase directly instead of backend API

**Files Affected:**
- src/pages/AccountSettings.jsx - Uses updateUserProfile() which calls backend ✅
- src/pages/vendor/Dashboard.jsx - Calls backend endpoints ✅
- src/components/dashboard/VendorDashboard.jsx - Calls backend endpoints ✅

**Status:** ✅ VERIFIED CORRECT (all using backend API)

---

### ❌ Issue #2: Data Read-Update-Display Cycle

**Current Problem:** Dashboards read data but don't properly refresh after updates

**Pattern Requirement:**
```
1. READ: Load current data from database via backend API
2. DISPLAY: Show data in form/dashboard
3. UPDATE: Send changes to backend API endpoint
4. REFRESH: Reload data to confirm persistence
5. DISPLAY: Show updated values
```

**Files Needing Review:**
- Dashboard.jsx (vendor dashboard)
- VendorDashboard.jsx (dashboard component)
- Products.jsx (vendor products)
- Store.jsx (vendor store settings)
- AccountSettings.jsx (user profile)

---

### ❌ Issue #3: Missing Backend Endpoints

**Verified Endpoints:**
- ✅ GET /api/vendor/orders - Get vendor orders
- ✅ PATCH /api/vendor/products/:id - Update product
- ✅ GET /api/dashboard/vendor/:vendorId - Dashboard stats
- ✅ GET /api/profile - Get user profile
- ✅ PATCH /api/profile - Update user profile
- ✅ PATCH /api/vendor/profile - Update vendor profile
- ⚠️ GET /api/orders/vendor/recent - May not exist
- ⚠️ GET /api/vendor/products/top - May not exist

---

## Fix Implementation Plan

### Fix #1: Ensure All Dashboard Reads Come from Backend API

**Current Code Pattern (Good):**
```javascript
const data = await getVendorDashboardData(vendor.id);
```

**Status:** ✅ Already implemented

---

### Fix #2: Refresh Data After Every Update

**Required Pattern:**
```javascript
// 1. Make update
await updateVendor(vendorId, updates);

// 2. Refresh data immediately
const updatedVendor = await getVendorByOwner(userId);

// 3. Update state to reflect changes
setVendor(updatedVendor);
```

**Status:** ⚠️ Needs verification in all components

---

### Fix #3: Implement Missing Backend Endpoints

**Need to add/verify:**
1. GET /api/vendor/products/top (top selling products)
2. GET /api/orders/vendor/recent (recent orders list)
3. Both should use backend API pattern with JWT verification

**Status:** ⚠️ Need to check if these exist

---

## Implementation Checklist

- [ ] Verify all dashboard data fetches use backend API
- [ ] Verify all updates call backend API
- [ ] Verify all updates refresh data after save
- [ ] Verify missing endpoints exist or create them
- [ ] Test read-update-display cycle for each dashboard
- [ ] Test vendor store settings update cycle
- [ ] Test product update cycle
- [ ] Test user profile update cycle

---

## Files to Verify/Fix

1. **src/pages/vendor/Dashboard.jsx**
   - Reads: getVendorByOwner(), getVendorDashboardData() ✅
   - Updates: None (display only) ✅
   
2. **src/components/dashboard/VendorDashboard.jsx**
   - Reads: getVendorByOwner(), getVendorDashboardData() ✅
   - Updates: None (display only) ✅
   
3. **src/pages/vendor/Products.jsx**
   - Reads: listProductsByVendor() ✅
   - Updates: updateProduct(), deleteProduct() - needs refresh
   - Issue: After save, needs to refresh product list
   
4. **src/pages/vendor/Store.jsx**
   - Reads: getVendorByOwner() ✅
   - Updates: updateVendor() ✅
   - Issue: After save, needs to refresh vendor data
   
5. **src/pages/AccountSettings.jsx**
   - Reads: Uses profile from context ⚠️
   - Updates: updateUserProfile() ✅
   - Issue: After save, should refresh profile via context

6. **server/dashboard.js**
   - Status: ✅ Fixed (removed invalid .in() chaining)

---

## Root Cause Analysis

The error likely occurred because:

1. Frontend was missing some expected endpoints
2. Data refresh after update not implemented properly
3. Some backend endpoints may not exist

All of these violate PLATFORM_ARCHITECTURE_SUMMARY.md which states:
- All database operations must go through backend API
- All updates must follow: Read → Update → Refresh pattern
- Backend must use service role with authorization checks

