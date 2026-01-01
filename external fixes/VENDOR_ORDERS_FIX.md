# Vendor Orders Database Mapping Fix

## Problem
The vendor orders endpoint was returning 0 orders because it was using incorrect database column names and table relationships.

## Root Cause Analysis

### Incorrect Column Names
- **Expected:** `price_in_cents`, `total_price_in_cents`
- **Actual:** `unit_price`, `total_price` (in `order_items` table)
- **Orders Table:** Uses `total_amount` (not `total_price`)

### Missing Relationships
The initial implementation tried to query columns that don't exist in the actual schema:
- `order_items.price_in_cents` ❌ (doesn't exist)
- `orders.total_price_in_cents` ❌ (doesn't exist)
- `order_items.created_at` ❌ (doesn't exist - use `orders.created_at`)

## Database Schema Discovered

### order_items Table Columns
```
id, order_id, product_id, variant_id, vendor_id, quantity, 
unit_price, total_price, metadata
```

### orders Table Columns
```
id, user_id, total_amount, currency, status, 
shipping_address, billing_address, metadata, created_at, updated_at,
tracking_number, shipping_carrier, estimated_delivery, 
shipped_at, delivered_at, cancelled_at, cancellation_reason, fulfillment_notes
```

### Key Finding
- User email is stored in `orders.metadata.payer_email` (from PayPal)
- This is more reliable than trying to access `auth.users` table

## Solution Implemented

### Backend Fix (server/vendor.js)
1. ✅ Changed `price_in_cents` → `unit_price`
2. ✅ Changed `total_price_in_cents` → `total_amount`
3. ✅ Removed `.order('created_at')` from `order_items` query (column doesn't exist)
4. ✅ Added `metadata` to orders SELECT (to get payer_email)
5. ✅ Extract `userEmail` from `order.metadata.payer_email` instead of auth.users

### Updated Response Structure
```javascript
{
  id,                // order_items.id
  orderId,          // order_items.order_id
  itemId,           // order_items.id (duplicate for clarity)
  productId,        // order_items.product_id
  variantId,        // order_items.variant_id
  quantity,         // order_items.quantity
  unitPrice,        // order_items.unit_price
  totalPrice,       // order_items.total_price
  status,           // orders.status
  createdAt,        // orders.created_at
  userEmail,        // orders.metadata.payer_email
  userId,           // orders.user_id
  metadata          // order_items.metadata
}
```

### Frontend Fix (src/pages/vendor/Orders.jsx)
- ✅ Changed `order.totalInCents / 100` → `order.totalPrice / 100`
- Component now correctly displays orders from the API

## Verification Results

Query test on seller2 (vendor ID: `0f134cb6-9ee5-4e4d-ba50-528cb55d3ca3`):
- ✅ 3 orders found
- ✅ All orders have correct status: "paid"
- ✅ Customer email correctly extracted: "buyer@example.com"
- ✅ Total amounts: 9999 (cents) = $99.99 each

## Testing Status
✅ Database query verified
✅ API endpoint fixed
✅ Field mapping corrected
✅ Frontend component updated
✅ Servers running (port 3001 backend, port 5174 frontend)
⏳ Visual testing in browser (ready for user verification)

## Files Modified
1. `server/vendor.js` - Fixed GET /:vendorId/orders endpoint
2. `src/pages/vendor/Orders.jsx` - Fixed field reference in table rendering
