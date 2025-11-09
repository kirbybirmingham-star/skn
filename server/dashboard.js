import express from 'express';
import { supabase } from '../src/lib/customSupabaseClient.js';

const router = express.Router();

router.get('/vendor/:vendorId', async (req, res) => {
  const { vendorId } = req.params;

  if (!vendorId) {
    return res.status(400).json({ error: 'Vendor ID is required' });
  }

  try {
    // --- Total Revenue and Total Orders ---
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('order_id, total_price')
      .eq('vendor_id', vendorId);

    if (orderItemsError) {
      throw orderItemsError;
    }

    const orderIds = [...new Set(orderItems.map(item => item.order_id))];

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status')
      .in('id', orderIds)
      .in('status', ['paid', 'fulfilled']);

    if (ordersError) {
      throw ordersError;
    }

    const paidOrderIds = new Set(orders.map(order => order.id));

    const totalRevenue = orderItems
      .filter(item => paidOrderIds.has(item.order_id))
      .reduce((acc, item) => acc + item.total_price, 0);

    const totalOrders = paidOrderIds.size;

    // --- Average Order Value ---
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      totalRevenue,
      totalOrders,
      averageOrderValue,
    });
  } catch (error) {
    console.error('Error fetching vendor dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
