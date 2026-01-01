import express from 'express';
import { supabase } from './supabaseClient.js';

const router = express.Router();

// Update inventory when orders are placed
router.post('/update-inventory-on-order', async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    // Get order items
    const { data: orderItems, error: orderError } = await supabase
      .from('order_items')
      .select('variant_id, quantity')
      .eq('order_id', orderId);

    if (orderError || !orderItems) {
      return res.status(404).json({ error: 'Order items not found' });
    }

    // Update inventory for each variant
    for (const item of orderItems) {
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('inventory_quantity')
        .eq('id', item.variant_id)
        .single();

      if (variantError || !variant) continue;

      const newQuantity = Math.max(0, variant.inventory_quantity - item.quantity);

      await supabase
        .from('product_variants')
        .update({ inventory_quantity: newQuantity })
        .eq('id', item.variant_id);

      // Log inventory transaction
      await supabase.rpc('log_inventory_transaction', {
        p_variant_id: item.variant_id,
        p_transaction_type: 'sale',
        p_quantity_change: -item.quantity,
        p_reason: `Order ${orderId}`,
        p_reference_type: 'order',
        p_reference_id: orderId
      });
    }

    res.json({ message: 'Inventory updated successfully' });
  } catch (error) {
    console.error('Error updating inventory on order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Restore inventory when orders are cancelled/refunded
router.post('/restore-inventory-on-refund', async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    // Get order items
    const { data: orderItems, error: orderError } = await supabase
      .from('order_items')
      .select('variant_id, quantity')
      .eq('order_id', orderId);

    if (orderError || !orderItems) {
      return res.status(404).json({ error: 'Order items not found' });
    }

    // Restore inventory for each variant
    for (const item of orderItems) {
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('inventory_quantity')
        .eq('id', item.variant_id)
        .single();

      if (variantError || !variant) continue;

      const newQuantity = variant.inventory_quantity + item.quantity;

      await supabase
        .from('product_variants')
        .update({ inventory_quantity: newQuantity })
        .eq('id', item.variant_id);

      // Log inventory transaction
      await supabase.rpc('log_inventory_transaction', {
        p_variant_id: item.variant_id,
        p_transaction_type: 'refund',
        p_quantity_change: item.quantity,
        p_reason: `Refund for order ${orderId}`,
        p_reference_type: 'refund',
        p_reference_id: orderId
      });
    }

    res.json({ message: 'Inventory restored successfully' });
  } catch (error) {
    console.error('Error restoring inventory on refund:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create inventory transaction record
router.post('/log-transaction', async (req, res) => {
  const { variantId, transactionType, quantityChange, reason, referenceType, referenceId } = req.body;

  if (!variantId || !transactionType || typeof quantityChange !== 'number') {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase.rpc('log_inventory_transaction', {
      p_variant_id: variantId,
      p_transaction_type: transactionType,
      p_quantity_change: quantityChange,
      p_reason: reason || 'Manual adjustment',
      p_reference_type: referenceType || 'manual',
      p_reference_id: referenceId
    });

    if (error) throw error;

    res.json({ transaction: data });
  } catch (error) {
    console.error('Error logging inventory transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;