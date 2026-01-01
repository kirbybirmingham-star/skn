# 🎯 Developer Quick Reference - Implementation Guide

**Last Updated:** December 31, 2025  
**Purpose:** Quick reference for understanding and using the fixed implementation

---

## Architecture at a Glance

```
Frontend (React)
    ↓
REST API Call: /api/*
    ↓
Backend (Express)
    - Verify JWT token
    - Check authorization (ownership)
    - Map fields to database schema
    - Use service role client
    ↓
Supabase (RLS policies bypassed by service role)
    ↓
Database (PostgreSQL)
    ↓
Response JSON to Frontend
```

**Key Rule:** Frontend NEVER calls Supabase directly. ALWAYS use `/api/*` backend endpoints.

---

## Common Operations

### Update Product

**Frontend:**
```javascript
import { updateProduct } from '@/api/EcommerceApi';

const result = await updateProduct(productId, {
  title: 'New Title',
  description: 'New Description',
  price_in_cents: 1500,  // In cents!
  image: 'https://...',
  category: 'Organic'
});

// result = { id, title, base_price, image_url, metadata, ... }
```

**What Happens:**
1. Frontend calls: `fetch('/api/vendor/products/:productId', { Authorization: token })`
2. Backend verifies JWT and vendor ownership
3. Backend maps: `price_in_cents` → `base_price`, `image` → `image_url`
4. Backend stores: category name in `metadata.category_name`
5. Database updates with service role (bypasses RLS)
6. Returns updated product

**Field Mapping:**
| Frontend | Database | Type |
|----------|----------|------|
| title | title | text |
| description | description | text |
| price_in_cents | base_price | integer |
| image | image_url | text |
| category | metadata.category_name | json |

---

### Update Profile

**Frontend:**
```javascript
import { useAuth } from '@/contexts/SupabaseAuthContext';

const { updateUserProfile } = useAuth();

await updateUserProfile({
  full_name: 'John Doe',
  phone: '555-1234',
  address: '123 Main St',
  city: 'Springfield',
  state: 'IL',
  zip_code: '62701',
  country: 'US'
});
```

**What Happens:**
1. Gets JWT from Supabase auth session
2. Calls: `fetch('/api/profile', { Authorization: token })`
3. Backend verifies JWT (user_id extracted from token)
4. Backend updates BOTH:
   - Direct columns: phone, address, city, state, zip_code, country
   - Metadata: Same fields (backward compatibility)
5. Database updates with service role
6. Returns updated profile

**No Field Mapping Needed** - Field names same on frontend and database

---

### Fetch Vendor Orders

**Frontend:**
```javascript
// Already implemented in Orders page
const response = await fetch('/api/vendor/:vendorId/orders', {
  headers: { Authorization: `Bearer ${token}` }
});

const { orders } = await response.json();
// orders = [
//   {
//     id,
//     orderId,
//     productId,
//     quantity,
//     unitPrice,        // ← in cents
//     totalPrice,       // ← in cents
//     status,
//     userEmail,        // ← from PayPal metadata
//     createdAt
//   }
// ]
```

**Field Mapping (Backend Does This):**
| Database | Frontend |
|----------|----------|
| order_items.id | id |
| order_items.order_id | orderId |
| order_items.unit_price | unitPrice |
| order_items.total_price | totalPrice |
| orders.status | status |
| orders.metadata.payer_email | userEmail |
| orders.created_at | createdAt |

---

## Category Management

### Create or Get Category

```javascript
import { getOrCreateCategoryByName } from '@/api/EcommerceApi';

const categoryId = await getOrCreateCategoryByName('Organic');

if (categoryId) {
  // categoryId = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  // Can use as category_id foreign key
} else {
  // Creation failed, check logs
}
```

### Auto-Create "Uncategorized"

```javascript
import { ensureDefaultCategory } from '@/api/EcommerceApi';

const uncategorizedId = await ensureDefaultCategory();
// Guarantees "Uncategorized" category exists
```

### Track Missing Categories

```javascript
import { 
  alertAdminMissingCategory,
  getAdminAlerts,
  resolveAdminAlert
} from '@/api/EcommerceApi';

// When category creation fails:
await alertAdminMissingCategory(
  productId,
  'RequestedCategoryName',
  'CREATION_FAILED'
);

// Admin queries alerts:
const alerts = await getAdminAlerts({ status: 'unresolved' });

// Admin resolves:
await resolveAdminAlert(alertId, categoryId);
```

### Bulk Operations

```javascript
import { 
  migrateMissingCategories,
  getCategoryStats
} from '@/api/EcommerceApi';

// Preview changes
const preview = await migrateMissingCategories({ dryRun: true });
// { total: 15, updated: 0, errors: [] }

// Execute migration
const result = await migrateMissingCategories({ dryRun: false });
// { total: 15, updated: 15, errors: [] }

// View statistics
const stats = await getCategoryStats();
// {
//   'organic': { name: 'Organic', count: 42 },
//   'produce': { name: 'Produce', count: 38 },
//   'uncategorized': { name: 'Uncategorized', count: 3 }
// }
```

---

## Backend Endpoints

### GET /api/profile
**Purpose:** Fetch current user's profile  
**Auth:** JWT required  
**Response:**
```json
{
  "id": "user-uuid",
  "user_id": "auth-uuid",
  "full_name": "John Doe",
  "phone": "555-1234",
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip_code": "62701",
  "country": "US",
  "metadata": { ... }
}
```

### PATCH /api/profile
**Purpose:** Update user's profile  
**Auth:** JWT required  
**Body:**
```json
{
  "full_name": "...",
  "phone": "...",
  "address": "...",
  "city": "...",
  "state": "...",
  "zip_code": "...",
  "country": "..."
}
```

### GET /api/vendor/:vendorId/orders
**Purpose:** Get vendor's orders  
**Auth:** JWT required + vendor ownership  
**Response:**
```json
{
  "orders": [
    {
      "id": "order-item-id",
      "orderId": "order-id",
      "productId": "product-id",
      "quantity": 2,
      "unitPrice": 1500,
      "totalPrice": 3000,
      "status": "paid",
      "userEmail": "buyer@example.com",
      "createdAt": "2025-12-31T..."
    }
  ]
}
```

### PATCH /api/vendor/products/:productId
**Purpose:** Update vendor's product  
**Auth:** JWT required + vendor ownership  
**Body:**
```json
{
  "title": "...",
  "description": "...",
  "price_in_cents": 1500,
  "image": "https://...",
  "category": "Organic"
}
```
**Response:**
```json
{
  "success": true,
  "product": {
    "id": "...",
    "title": "...",
    "base_price": 1500,
    "image_url": "...",
    "metadata": { "category_name": "Organic" },
    ...
  }
}
```

---

## Error Handling

### Typical Errors

```javascript
try {
  await updateProduct(productId, updates);
} catch (error) {
  // error.message could be:
  // "No active session" - User not logged in
  // "HTTP 404" - Product not found
  // "HTTP 403" - Not authorized to edit
  // "HTTP 400" - Validation error (title too short)
  // "HTTP 500" - Server error (check logs)
}
```

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Use the returned data |
| 400 | Bad Request | Check input validation |
| 401 | Unauthorized | Get new JWT token |
| 403 | Forbidden | Not authorized for this resource |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Check backend logs |

---

## Debugging Tips

### Check JWT Token

```javascript
import { supabase } from '@/lib/customSupabaseClient';

const { data: { session } } = await supabase.auth.getSession();
console.log('JWT Token:', session?.access_token);
console.log('Token expires:', session?.expires_at);
```

### Check Authorization

```javascript
// Verify you have a vendor
const vendor = await getVendorByOwner(user.id);
console.log('Vendor:', vendor);

// Verify product ownership
const product = await getProductById(productId);
console.log('Product vendor_id:', product.vendor_id);
console.log('Your vendor_id:', vendor.id);
console.log('Match:', product.vendor_id === vendor.id);
```

### Check Backend Logs

```bash
# Terminal showing backend logs
# Look for:
# - [ProfileAPI] messages for profile updates
# - [Vendor] messages for order/product operations
# - Explicit success/failure logs with emoji indicators
# ✅ Success
# ❌ Error
# 📋 Info
# ⚠️  Warning
```

### Test API Endpoint Directly

```javascript
// In browser console:
const response = await fetch('/api/vendor/products/some-id', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ title: 'Test' })
});
console.log(await response.json());
```

---

## Common Mistakes to Avoid

### ❌ DON'T: Call Supabase Directly for Data Updates
```javascript
// WRONG!
const { data } = await supabase
  .from('products')
  .update({ title: 'New' })
  .eq('id', productId);
```

### ✅ DO: Use Backend API
```javascript
// CORRECT!
const product = await updateProduct(productId, { title: 'New' });
```

---

### ❌ DON'T: Send Database Field Names from Frontend
```javascript
// WRONG!
updateProduct(productId, {
  base_price: 1500,    // Database name, not frontend!
  image_url: '...'     // Database name, not frontend!
});
```

### ✅ DO: Use Frontend Field Names
```javascript
// CORRECT!
updateProduct(productId, {
  price_in_cents: 1500,  // Frontend name
  image: '...'           // Frontend name
});
```

---

### ❌ DON'T: Forget JWT in API Calls
```javascript
// WRONG!
fetch('/api/profile', {
  method: 'PATCH',
  body: JSON.stringify(updates)
  // Missing Authorization header!
});
```

### ✅ DO: Include JWT Token
```javascript
// CORRECT!
const { data: { session } } = await supabase.auth.getSession();
fetch('/api/profile', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify(updates)
});
```

---

### ❌ DON'T: Assume Silent Failures (204 responses)
```javascript
// WRONG - RLS will silently deny!
const result = await supabase
  .from('products')
  .update(data)
  .eq('id', id);
// May succeed in UI but fail in database!
```

### ✅ DO: Use Backend with Explicit Errors
```javascript
// CORRECT - Backend returns explicit errors
try {
  const result = await updateProduct(id, data);
  // Guaranteed success or explicit error
} catch (err) {
  console.error('Update failed:', err.message);
}
```

---

## File Reference Quick Links

| File | Purpose |
|------|---------|
| [server/profile.js](server/profile.js) | Profile API endpoints |
| [server/vendor.js](server/vendor.js) | Product & order API endpoints |
| [server/middleware.js](server/middleware.js) | JWT verification |
| [src/api/EcommerceApi.jsx](src/api/EcommerceApi.jsx) | Frontend API functions |
| [src/contexts/SupabaseAuthContext.jsx](src/contexts/SupabaseAuthContext.jsx) | Profile update context |
| [src/pages/vendor/Products.jsx](src/pages/vendor/Products.jsx) | Product management UI |
| [src/pages/vendor/Orders.jsx](src/pages/vendor/Orders.jsx) | Orders display UI |
| [src/pages/AccountSettings.jsx](src/pages/AccountSettings.jsx) | Profile update UI |

---

## Architecture Documents

| Document | Purpose |
|----------|---------|
| [PLATFORM_ARCHITECTURE_SUMMARY.md](PLATFORM_ARCHITECTURE_SUMMARY.md) | Complete architecture specification |
| [IMPLEMENTATION_VERIFICATION_REPORT.md](IMPLEMENTATION_VERIFICATION_REPORT.md) | Verification against spec |
| [IMPLEMENTATION_FIXES_COMPLETE.md](IMPLEMENTATION_FIXES_COMPLETE.md) | Detailed fix descriptions |
| [FINAL_VERIFICATION_CHECKLIST.md](FINAL_VERIFICATION_CHECKLIST.md) | Testing checklist |

---

**All questions? See the architecture summary or implementation guides!**

