/**
 * Orders API Endpoints
 * Handles order creation, retrieval, status management
 */

import express from 'express';
import { supabase } from './supabaseClient.js';
import { authenticateUser } from './middleware.js';

const router = express.Router();

// Middleware - Apply authentication to all routes
router.use(authenticateUser);

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { paypalOrderId, shippingAddress, items } = req.body;

    if (!paypalOrderId || !shippingAddress || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Calculate total from items
    let totalCents = 0;
    const itemDetails = [];

    // Fetch variant details and calculate total
    for (const item of items) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('id, product_id, price_in_cents, sale_price_in_cents, title')
        .eq('id', item.variantId)
        .single();

      if (!variant) {
        return res.status(404).json({ message: `Variant ${item.variantId} not found` });
      }

      const price = item.priceAtPurchase || variant.sale_price_in_cents || variant.price_in_cents;
      const subtotal = price * item.quantity;
      totalCents += subtotal;

      itemDetails.push({
        variant_id: variant.id,
        product_id: variant.product_id,
        quantity: item.quantity,
        price_at_purchase_cents: price,
        subtotal_cents: subtotal
      });
    }

    // Get vendor ID from first product (all items should be from same vendor in basic flow)
    const { data: product } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', itemDetails[0].product_id)
      .single();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        vendor_id: product.vendor_id,
        status: 'pending',
        total_amount_cents: totalCents,
        currency: 'USD',
        shipping_address: shippingAddress,
        payment_method: 'paypal',
        payment_id: paypalOrderId
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Create order items
    const orderItemsData = itemDetails.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      throw itemsError;
    }

    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/orders/my-orders
 * Get all orders for the current user
 */
router.get('/my-orders', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * limit;
    const { data: orders, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/orders/:orderId
 * Get a specific order
 */
router.get('/:orderId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product: product_id (
            id,
            title,
            image_url
          ),
          variant: variant_id (
            id,
            title,
            price_in_cents,
            sale_price_in_cents
          )
        )
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Order not found' });
      }
      throw error;
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * PATCH /api/orders/:orderId/status
 * Update order status (admin/vendor only)
 */
router.patch('/:orderId/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Verify user is vendor or admin
    const { data: order } = await supabase
      .from('orders')
      .select('vendor_id')
      .eq('id', orderId)
      .single();

    if (order.vendor_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { data: updated, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/orders/:orderId/cancel
 * Cancel an order
 */
router.post('/:orderId/cancel', async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { reason } = req.body;

    // Verify user owns the order
    const { data: order } = await supabase
      .from('orders')
      .select('user_id, status')
      .eq('id', orderId)
      .single();

    if (order.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(updated);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
