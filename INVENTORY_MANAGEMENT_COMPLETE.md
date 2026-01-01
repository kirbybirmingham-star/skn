# Inventory Management System - Complete Flow Documentation

## Overview
The inventory management system automatically tracks product quantities when items are sold and restores them when orders are cancelled or refunded.

## Database Fields
- **products table**: `inventory_quantity` (INTEGER) - Total stock at product level
- **product_variants table**: `inventory_quantity` (INTEGER) - Stock per variant
- **inventory_logs table**: Transaction audit trail with timestamps and reasons

## Complete Order-to-Inventory Flow

### 1. Product Creation
```
Vendor creates product with variants
↓
Each variant has: inventory_quantity (initial stock)
Example: Variant A (Color: Red, Size: M) → inventory_quantity: 50
```

### 2. Customer Purchases (Checkout Flow)
```
Customer adds items to cart
↓
Clicks checkout
↓
Payment processed via PayPal
↓
Order created with status: 'pending'
↓
Payment captured (PayPal → /api/paypal-capture-order/:orderID)
↓
handleStatusChange() triggered: 'pending' → 'paid'
```

### 3. Inventory Deduction on Payment (KEY POINT)
When order transitions to **'paid'** status:
```
handleStatusChange() in orderStatusManager.js
  ↓
triggerStatusActions() for 'paid' status
  ↓
handleOrderPaid() executes:
  - For each order_item:
    - Fetch variant.inventory_quantity (or product.inventory_quantity)
    - Calculate: newQuantity = Math.max(0, current - item.quantity)
    - Update product_variants.inventory_quantity = newQuantity
    - Log transaction: type='sale', change=-quantity
```

**Example:**
- Variant A had inventory_quantity: 50
- Customer orders 5 units
- After payment: inventory_quantity becomes 45
- Log entry: { type: 'sale', quantity_change: -5, reason: 'Order paid: {orderId}' }

### 4. Order Confirmation (Optional Second Deduction Check)
When order transitions to **'confirmed'** status:
```
If status came from 'paid':
  - Skip inventory deduction (already done)
Else (if confirmed directly):
  - Deduct inventory (fallback for manual confirmations)
```

### 5. Order Cancellation
When order transitions to **'cancelled'** status:
```
handleOrderCancelled() executes:
  - For each order_item:
    - Fetch current variant.inventory_quantity
    - Calculate: newQuantity = current + item.quantity
    - Update product_variants.inventory_quantity = newQuantity
    - Log transaction: type='cancellation', change=+quantity
```

**Example:**
- Variant A had inventory_quantity: 45 (after sale)
- Customer cancels order for 5 units
- After cancellation: inventory_quantity becomes 50 again
- Log entry: { type: 'cancellation', quantity_change: 5 }

### 6. Order Refund
When order transitions to **'refunded'** status:
```
handleOrderRefunded() would restore inventory
(Similar to cancellation)
```

## Key Implementation Details

### File: server/orderStatusManager.js
- **handleOrderPaid()**: Deducts inventory when payment confirmed
- **handleOrderConfirmed()**: Fallback deduction if not already done
- **handleOrderCancelled()**: Restores inventory on cancellation
- **triggerStatusActions()**: Routes status changes to appropriate handlers

### Field Name Consistency ✅
- Uses: `inventory_quantity` (correct field name)
- Checks both variants and products
- Handles null/undefined safely
- Logs all changes for audit trail

### Error Handling
- Continues processing other items if one fails
- Logs errors for debugging
- Updates inventory even if transaction logging fails
- Non-blocking: inventory deduction doesn't block order status change

## Testing the System

### Test Case 1: Basic Sale & Inventory Deduction
```javascript
// 1. Create product with variant (inventory_quantity: 50)
// 2. Customer purchases 5 units
// 3. Wait for payment capture
// 4. Verify: variant.inventory_quantity === 45
// 5. Check logs: inventory_logs has entry with type='sale', quantity=-5
```

### Test Case 2: Cancellation & Restoration
```javascript
// 1. Complete Test Case 1
// 2. Customer cancels order
// 3. Wait for status change to 'cancelled'
// 4. Verify: variant.inventory_quantity === 50
// 5. Check logs: inventory_logs has entry with type='cancellation', quantity=+5
```

### Test Case 3: Multiple Variants
```javascript
// 1. Create product with 3 variants (each with 50 units)
// 2. Customer orders:
//    - Variant A: 3 units
//    - Variant B: 2 units
//    - Variant C: 1 unit
// 3. After payment:
//    - Variant A: 47, Variant B: 48, Variant C: 49
// 4. Verify each independently
```

## API Endpoints for Manual Inventory Management

### Update Inventory Manually
```
PATCH /api/inventory/variant/:variantId/quantity
Body: { quantity: 25, reason: 'Manual adjustment' }
Response: { old_quantity, new_quantity, change }
```

### Get Inventory for Vendor
```
GET /api/inventory/vendor/:vendorId?page=1&perPage=50&lowStock=false
Response: { variants: [...], alerts: [...], pagination: {...} }
```

### Bulk Update Inventory
```
POST /api/inventory/bulk-update
Body: { updates: [{ variantId: '123', quantity: 30, reason: 'Restock' }] }
```

### Get Inventory Transactions
```
GET /api/inventory/transactions/:variantId?page=1
Response: Paginated transaction history
```

## Status Transition Rules

```
pending → paid (payment confirmed)
  ↓ (inventory deducted here)
confirmed (vendor confirms)
processing → packed → shipped → delivered
                     ↓
           Can go to: cancelled, disputed, refunded
```

## Inventory Deduction Summary

| Event | Trigger | Action | Field Updated |
|-------|---------|--------|----------------|
| Payment Confirmed | order → 'paid' | Deduct quantity | inventory_quantity |
| Order Confirmed | order → 'confirmed' | Deduct (if not paid) | inventory_quantity |
| Order Cancelled | order → 'cancelled' | Restore quantity | inventory_quantity |
| Order Refunded | order → 'refunded' | Restore quantity | inventory_quantity |
| Manual Adjustment | PATCH /inventory | Add/Subtract | inventory_quantity |

## Database Structure

### product_variants Table
```sql
id (UUID)
product_id (UUID) → references products
price_in_cents (INTEGER)
sale_price_in_cents (INTEGER)
inventory_quantity (INTEGER) ← MAIN FIELD FOR TRACKING
sku (TEXT)
title (TEXT)
attributes (JSONB)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### inventory_logs Table (Audit Trail)
```sql
id (UUID)
variant_id (UUID) → references product_variants
product_id (UUID) → references products
transaction_type (TEXT) - 'sale', 'refund', 'adjustment', 'cancellation'
quantity_change (INTEGER)
new_quantity (INTEGER)
reason (TEXT)
reference_type (TEXT) - 'order', 'manual', 'refund'
reference_id (UUID) - order_id or user_id
created_at (TIMESTAMP)
```

## Common Issues & Solutions

### Issue: Inventory not deducting
**Check:**
1. Does order reach 'paid' status? (Check order.status in database)
2. Is payment capture successful? (Check paypal-capture logs)
3. Are variant IDs correct? (Check order_items.variant_id)
4. Does variant have inventory_quantity field? (Check product_variants schema)

### Issue: Inventory over-deducting (double deduction)
**Solution:**
- New code checks: if oldStatus is 'paid' and newStatus is 'confirmed', skip deduction
- Prevents double-deduction if both handlers run

### Issue: Inventory negative
**Protection:**
- Code uses: `Math.max(0, current - quantity)`
- Prevents inventory from going below 0
- Consider enabling 'allow_negative_stock' setting if backorders needed

## Configuration

### Inventory Settings (per vendor)
```javascript
{
  track_inventory: true,           // Enable/disable tracking
  auto_create_alerts: true,        // Auto-alert on low stock
  low_stock_threshold: 5,          // Items considered "low stock"
  allow_negative_stock: false,     // Allow selling when out of stock
  default_adjustment_reason: 'Manual adjustment'
}
```

## Monitoring & Alerts

### Low Stock Alerts
- Triggered when: inventory_quantity ≤ low_stock_threshold
- Can be auto-created or manual
- Vendor receives notification

### Inventory Audit Trail
- Every change logged in inventory_logs
- Includes: what changed, when, by whom, why
- Use for reconciliation and compliance

## Next Steps

1. ✅ Fixed field name inconsistency (inventory_count → inventory_quantity)
2. ✅ Added handleOrderPaid() for immediate inventory deduction
3. ✅ Updated triggerStatusActions() to properly route status changes
4. ✅ Enhanced cancellation handler with proper logging
5. Test the complete flow end-to-end
6. Monitor production for any inventory discrepancies
7. Set up alerts for inventory-related errors
