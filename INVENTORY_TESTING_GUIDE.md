# Inventory Management - End-to-End Testing Guide

## Overview
This guide walks you through testing the complete inventory management workflow to ensure quantities are properly tracked when items are sold.

## Prerequisites
- A running development environment
- A test vendor account
- A test customer account
- Products with variants created
- PayPal sandbox configured

## Test Scenarios

### Test 1: Basic Inventory Deduction on Sale

**Setup:**
```
1. Login as vendor
2. Navigate to inventory management or product list
3. Note initial inventory for a variant (e.g., 50 units)
4. Record: VARIANT_ID, INITIAL_QUANTITY
```

**Execute:**
```
1. Logout vendor, login as customer
2. Search for the product
3. Add 3 units to cart
4. Proceed to checkout
5. Complete PayPal payment (sandbox)
6. Wait for order confirmation (2-5 seconds for payment processing)
```

**Verify:**
```
1. Login to database viewer or run query:
   
   SELECT id, inventory_quantity 
   FROM product_variants 
   WHERE id = 'VARIANT_ID';
   
   Expected: inventory_quantity = INITIAL_QUANTITY - 3
   Example: 50 - 3 = 47
   
2. Check inventory logs:
   
   SELECT * FROM inventory_logs 
   WHERE reference_id = 'ORDER_ID' 
   AND transaction_type = 'sale';
   
   Expected: quantity_change = -3, reason includes order ID
   
3. Check server logs:
   - Look for: "Processing inventory deduction for paid order: ORDER_ID"
   - Look for: "Inventory deduction completed for order: ORDER_ID"
```

**Success Criteria:**
- ✅ Inventory decreases by 3
- ✅ Transaction logged with type='sale'
- ✅ Order status is 'paid'
- ✅ No error messages in logs

---

### Test 2: Inventory Restoration on Cancellation

**Setup:**
- Complete Test 1 successfully
- Note the order ID and current inventory (should be INITIAL - 3)

**Execute:**
```
1. Login as vendor or admin
2. Navigate to order management
3. Find the order from Test 1
4. Click "Cancel Order"
5. Confirm cancellation with reason
```

**Verify:**
```
1. Check inventory:
   
   SELECT id, inventory_quantity 
   FROM product_variants 
   WHERE id = 'VARIANT_ID';
   
   Expected: inventory_quantity = INITIAL_QUANTITY
   Example: Should return to 50
   
2. Check inventory logs:
   
   SELECT * FROM inventory_logs 
   WHERE reference_id = 'ORDER_ID' 
   ORDER BY created_at DESC;
   
   Expected: New entry with type='cancellation', quantity_change = +3
   
3. Check order status:
   Expected: status = 'cancelled'
```

**Success Criteria:**
- ✅ Inventory increases back to original amount
- ✅ Cancellation transaction logged
- ✅ Quantity change is positive (+3)
- ✅ Original sale transaction still visible in logs

---

### Test 3: Multiple Items in Single Order

**Setup:**
- Have at least 2 different products with variants available
- Note inventory for each: VARIANT_A_QTY, VARIANT_B_QTY

**Execute:**
```
1. Login as customer
2. Add to cart:
   - Product A, Variant 1: 5 units
   - Product B, Variant 2: 3 units
3. Proceed to checkout
4. Complete PayPal payment
5. Wait for processing
```

**Verify:**
```
1. Check both variant inventories:
   
   SELECT id, inventory_quantity 
   FROM product_variants 
   WHERE id IN ('VARIANT_A', 'VARIANT_B');
   
   Expected:
   - VARIANT_A: VARIANT_A_QTY - 5
   - VARIANT_B: VARIANT_B_QTY - 3
   
2. Check transaction logs:
   
   SELECT * FROM inventory_logs 
   WHERE reference_id = 'ORDER_ID'
   ORDER BY created_at;
   
   Expected: 2 sale transactions (one per variant)
```

**Success Criteria:**
- ✅ Both variants have correct reduced quantities
- ✅ Two separate transaction logs created
- ✅ Each with correct quantity_change (-5 and -3)

---

### Test 4: Partial Inventory Deduction (Zero Floor)

**Setup:**
- Find a product with low inventory (e.g., 2 units)
- Note VARIANT_ID and current quantity

**Execute:**
```
1. Login as customer
2. Add 5 units to cart (more than available)
3. Attempt checkout
   
   Note: Should either:
   a) Show "Not enough inventory" error, OR
   b) Allow purchase if backorders enabled (depends on settings)
```

**Verify if purchase allowed:**
```
1. Check inventory after purchase:
   
   SELECT inventory_quantity 
   FROM product_variants 
   WHERE id = 'VARIANT_ID';
   
   Expected: 0 (not negative)
   Code protection: Math.max(0, 2 - 5) = 0
   
2. Check logs show full quantity deducted
```

**Success Criteria:**
- ✅ Inventory never goes negative
- ✅ Correctly deducted up to zero
- ✅ Transaction shows full quantity change attempted

---

### Test 5: Refund and Inventory Restoration

**Setup:**
- Complete a successful purchase (Test 1)
- Have order in 'delivered' status

**Execute:**
```
1. Login as vendor/admin
2. Navigate to order details
3. Request refund (if available)
4. Approve refund (admin)
5. Wait for processing
```

**Verify:**
```
1. Check inventory:
   
   SELECT inventory_quantity 
   FROM product_variants 
   WHERE id = 'VARIANT_ID';
   
   Expected: Restored to original amount
   
2. Check order status:
   Expected: 'refunded'
   
3. Check logs:
   
   SELECT * FROM inventory_logs 
   WHERE reference_id = 'ORDER_ID'
   ORDER BY created_at;
   
   Expected: 
   - Original 'sale' transaction: -3
   - Refund transaction: +3
```

**Success Criteria:**
- ✅ Inventory fully restored
- ✅ Refund transaction logged
- ✅ Net inventory change = 0

---

### Test 6: Status Transition Flow (Paid → Confirmed)

**Setup:**
- Have an order with status 'paid'

**Execute:**
```
1. Manually trigger status change: paid → confirmed
   
   Via admin panel or direct API call:
   PATCH /api/orders/:orderId/status
   Body: { status: 'confirmed' }
```

**Verify:**
```
1. Check inventory has not been double-deducted:
   
   SELECT inventory_quantity 
   FROM product_variants 
   WHERE id = 'VARIANT_ID';
   
   Expected: Deducted only once (not twice)
   
2. Check transaction logs:
   
   SELECT * FROM inventory_logs 
   WHERE reference_id = 'ORDER_ID'
   ORDER BY created_at;
   
   Expected: Only ONE sale transaction (not two)
```

**Success Criteria:**
- ✅ Inventory deducted only once
- ✅ Only one sale transaction logged
- ✅ No duplicate deductions

---

## Manual Testing via Database Queries

### Quick Inventory Check
```sql
-- See current inventory for all variants
SELECT 
  pv.id,
  pv.inventory_quantity,
  p.title,
  COUNT(oi.id) as times_sold
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
LEFT JOIN order_items oi ON pv.id = oi.variant_id
GROUP BY pv.id, pv.inventory_quantity, p.title
ORDER BY pv.inventory_quantity ASC;
```

### Inventory Audit Trail
```sql
-- See all inventory transactions for a variant
SELECT 
  transaction_type,
  quantity_change,
  reason,
  created_at
FROM inventory_logs
WHERE variant_id = 'VARIANT_ID'
ORDER BY created_at DESC
LIMIT 20;
```

### Order-Inventory Correlation
```sql
-- Verify inventory matches order items
SELECT 
  o.id as order_id,
  o.status,
  STRING_AGG(pv.id::text, ', ') as variant_ids,
  SUM(oi.quantity) as total_quantity,
  COUNT(DISTINCT oi.variant_id) as num_variants
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN product_variants pv ON oi.variant_id = pv.id
WHERE o.created_at > NOW() - INTERVAL '1 day'
GROUP BY o.id, o.status
ORDER BY o.created_at DESC;
```

---

## Server Log Monitoring

### What to Look For

**Success Indicators:**
```
✓ "Processing inventory deduction for paid order: {order_id}"
✓ "Inventory deduction completed for order: {order_id}"
✓ Order status changes: pending → paid → confirmed → processing
```

**Error Indicators:**
```
✗ "Failed to update variant X inventory: ..."
✗ "Failed to log inventory transaction..."
✗ Order stuck in 'pending' status
✗ Missing 'paid' status transition
```

### Enable Debug Logging
```javascript
// In orderStatusManager.js, console.log already includes:
console.log(`Processing inventory deduction for paid order: ${order.id}`);
console.log(`Inventory deduction completed for order: ${order.id}`);
console.error(`Failed to update variant ${item.variant_id} inventory:...`);
```

---

## Common Issues & Solutions

### Issue: Inventory not decreasing after payment

**Check:**
1. Order reaches 'paid' status
   ```sql
   SELECT id, status FROM orders WHERE id = 'ORDER_ID';
   ```

2. Order items exist
   ```sql
   SELECT * FROM order_items WHERE order_id = 'ORDER_ID';
   ```

3. Variants exist and have inventory_quantity
   ```sql
   SELECT id, inventory_quantity FROM product_variants WHERE id = 'VARIANT_ID';
   ```

4. Server logs show handler was called
   ```
   Look for: "Processing inventory deduction for paid order"
   ```

**Solutions:**
- Check PayPal capture log for errors
- Verify order.status is actually 'paid'
- Check user permissions on database
- Restart server if code changes were made

---

### Issue: Inventory going negative

**This should NOT happen** - Code uses `Math.max(0, newQuantity)` to prevent this.

**If it does:**
1. Check orderStatusManager.js line with `Math.max(0, ...)`
2. Manually fix via inventory adjustment:
   ```sql
   UPDATE product_variants 
   SET inventory_quantity = 0 
   WHERE id = 'VARIANT_ID' AND inventory_quantity < 0;
   ```

---

### Issue: Double deduction (inventory decreased twice)

**This should NOT happen** - New code checks `if (oldStatus !== 'paid')` before deducting on 'confirmed'.

**If it does:**
1. Check transaction logs for duplicate entries
   ```sql
   SELECT * FROM inventory_logs 
   WHERE reference_id = 'ORDER_ID' 
   AND transaction_type = 'sale'
   ORDER BY created_at;
   ```

2. Manually restore if needed:
   ```sql
   UPDATE product_variants 
   SET inventory_quantity = inventory_quantity + quantity_deducted 
   WHERE id = 'VARIANT_ID';
   ```

---

## Performance Considerations

**Inventory Operations Timing:**
- Database update: ~50-100ms
- Transaction log: ~20-50ms
- Total per item: ~100-150ms
- For 5-item order: ~500-750ms (acceptable)

**Optimization if needed:**
- Batch update multiple variants in single transaction
- Use database triggers for automatic logging
- Cache inventory for frequently viewed products

---

## Success Checklist

After completing all tests, verify:

- [ ] Test 1: Basic deduction works
- [ ] Test 2: Cancellation restoration works
- [ ] Test 3: Multiple items handled correctly
- [ ] Test 4: Negative floor prevention works
- [ ] Test 5: Refund restoration works
- [ ] Test 6: No double-deduction on transition
- [ ] Database queries show correct data
- [ ] Server logs show no errors
- [ ] Transaction audit trail complete
- [ ] Order-to-inventory reconciliation works

## Reporting Issues

If inventory management isn't working:

1. **Gather Information:**
   - Order ID
   - Variant IDs
   - Expected vs actual quantities
   - Timestamps of issue
   - Server logs (last 30 minutes)

2. **Check Diagnostics:**
   ```bash
   # Run verification script
   node verify-inventory-system.js
   ```

3. **Document:**
   - Screenshot of database state
   - Copy of server log errors
   - Steps to reproduce

---

## Regression Testing

After any changes to order or inventory code:

1. Run full test suite: Test 1-6
2. Check for new errors in logs
3. Verify transaction logs are created
4. Confirm no double-deductions
5. Test cancellation/refund still work

This ensures changes don't break inventory tracking.
