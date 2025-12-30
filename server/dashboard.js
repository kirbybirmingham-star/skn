import express from 'express';
import { supabase } from './supabaseClient.js';

const router = express.Router();

router.get('/vendor/:vendorId', async (req, res) => {
  const { vendorId } = req.params;
  console.log('[Dashboard] GET /vendor/:vendorId - vendorId:', vendorId);

  if (!vendorId) {
    console.warn('[Dashboard] Missing vendor ID');
    return res.status(400).json({ error: 'Vendor ID is required' });
  }

  // Defensive check: if Supabase is not configured, return mock data
  if (!supabase) {
    console.warn('[dashboard] ⚠️ Supabase client not initialized for vendor:', vendorId);
    console.warn('[dashboard] Returning mock dashboard data - database not connected');
    return res.json({
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      recentOrders: []
    });
  }

  try {
    console.log('[Dashboard] Fetching order items for vendor:', vendorId);
    // --- Total Revenue and Total Orders ---
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('order_id, total_price')
      .eq('vendor_id', vendorId);

    if (orderItemsError) {
      console.error('[Dashboard] Error fetching order items:', orderItemsError);
      throw orderItemsError;
    }

    console.log('[Dashboard] Order items found:', orderItems?.length || 0);

    const orderIds = [...new Set(orderItems.map(item => item.order_id))];
    console.log('[Dashboard] Unique order IDs:', orderIds.length);

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status')
      .in('id', orderIds)
      .in('status', ['paid', 'fulfilled']);

    if (ordersError) {
      console.error('[Dashboard] Error fetching orders:', ordersError);
      throw ordersError;
    }

    console.log('[Dashboard] Paid/fulfilled orders found:', orders?.length || 0);

    const paidOrderIds = new Set(orders.map(order => order.id));

    const totalRevenue = orderItems
      .filter(item => paidOrderIds.has(item.order_id))
      .reduce((acc, item) => acc + item.total_price, 0);

    const totalOrders = paidOrderIds.size;

    // --- Average Order Value ---
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const responseData = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
    };

    console.log('[Dashboard] Returning dashboard data:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('[Dashboard] Error fetching vendor dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
