import express from 'express';
import { supabase } from './supabaseClient.js';

const router = express.Router();

// Helper function to build date filters
const buildDateFilter = (startDate, endDate) => {
  const filters = {};
  if (startDate) filters.gte = startDate;
  if (endDate) filters.lte = endDate;
  return filters;
};

// Helper function to calculate metrics
const calculateMetrics = (orders, orderItems) => {
  const totalRevenue = orderItems.reduce((sum, item) => sum + item.total_price, 0);
  const totalOrders = new Set(orderItems.map(item => item.order_id)).size;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue
  };
};

// ===== SYSTEM-WIDE ANALYTICS =====

// Get system-wide metrics
router.get('/system/metrics', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Get all paid/fulfilled orders within date range
    const dateFilter = buildDateFilter(start_date, end_date);

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_amount, created_at, status, shipped_at, delivered_at')
      .in('status', ['paid', 'fulfilled', 'shipped', 'delivered'])
      .gte('created_at', dateFilter.gte || '2020-01-01')
      .lte('created_at', dateFilter.lte || new Date().toISOString());

    if (ordersError) throw ordersError;

    const orderIds = orders.map(order => order.id);

    // Get all order items for these orders
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('order_id, total_price, quantity')
      .in('order_id', orderIds);

    if (itemsError) throw itemsError;

    // Calculate basic metrics
    const metrics = calculateMetrics(orders, orderItems);

    // Get order status distribution
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Calculate processing times
    const processingTimes = orders
      .filter(order => order.delivered_at && order.created_at)
      .map(order => {
        const created = new Date(order.created_at);
        const delivered = new Date(order.delivered_at);
        return (delivered - created) / (1000 * 60 * 60 * 24); // days
      });

    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

    res.json({
      ...metrics,
      statusDistribution: statusCounts,
      averageProcessingTime: avgProcessingTime,
      orderConversionRate: orderIds.length > 0 ? (orderItems.length / orderIds.length) : 0
    });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get revenue trends over time
router.get('/system/revenue-trends', async (req, res) => {
  try {
    const { period = 'daily', start_date, end_date } = req.query; // period: 'daily', 'weekly', 'monthly'

    const dateFilter = buildDateFilter(start_date, end_date);

    const { data: revenueData, error } = await supabase
      .from('order_items')
      .select(`
        total_price,
        orders!inner(created_at, status)
      `)
      .in('orders.status', ['paid', 'fulfilled', 'shipped', 'delivered'])
      .gte('orders.created_at', dateFilter.gte || '2020-01-01')
      .lte('orders.created_at', dateFilter.lte || new Date().toISOString());

    if (error) throw error;

    // Group by time period
    const groupedRevenue = revenueData.reduce((acc, item) => {
      const date = new Date(item.orders.created_at);
      let key;

      switch (period) {
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default: // daily
          key = date.toISOString().split('T')[0];
      }

      acc[key] = (acc[key] || 0) + item.total_price;
      return acc;
    }, {});

    // Convert to chart-friendly format
    const trends = Object.entries(groupedRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    res.json({ trends, period });
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top products system-wide
router.get('/system/top-products', async (req, res) => {
  try {
    const { limit = 10, start_date, end_date } = req.query;

    const dateFilter = buildDateFilter(start_date, end_date);

    const { data: topProducts, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        total_price,
        products!inner(title, id),
        orders!inner(created_at, status)
      `)
      .in('orders.status', ['paid', 'fulfilled', 'shipped', 'delivered'])
      .gte('orders.created_at', dateFilter.gte || '2020-01-01')
      .lte('orders.created_at', dateFilter.lte || new Date().toISOString())
      .order('total_price', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    // Aggregate by product
    const productStats = topProducts.reduce((acc, item) => {
      const productId = item.products.id;
      const product = item.products;

      if (!acc[productId]) {
        acc[productId] = {
          productId,
          productName: product.title,
          totalRevenue: 0,
          totalQuantity: 0,
          orderCount: 0
        };
      }

      acc[productId].totalRevenue += item.total_price;
      acc[productId].totalQuantity += item.quantity;
      acc[productId].orderCount += 1;

      return acc;
    }, {});

    const result = Object.values(productStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, parseInt(limit));

    res.json(result);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== VENDOR-SPECIFIC ANALYTICS =====

// Get vendor metrics
router.get('/vendor/:vendorId/metrics', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { start_date, end_date } = req.query;

    if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    const dateFilter = buildDateFilter(start_date, end_date);

    // Get vendor's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('vendor_id', vendorId);

    if (productsError) throw productsError;

    const productIds = products.map(p => p.id);

    // Get order items for vendor's products
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        order_id,
        total_price,
        quantity,
        orders!inner(id, status, created_at, shipped_at, delivered_at)
      `)
      .in('product_id', productIds)
      .in('orders.status', ['paid', 'fulfilled', 'shipped', 'delivered'])
      .gte('orders.created_at', dateFilter.gte || '2020-01-01')
      .lte('orders.created_at', dateFilter.lte || new Date().toISOString());

    if (orderItemsError) throw orderItemsError;

    const metrics = calculateMetrics(orderItems.map(item => item.orders), orderItems);

    // Calculate vendor-specific metrics
    const uniqueOrders = new Set(orderItems.map(item => item.order_id));
    const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    // Calculate fulfillment rates
    const shippedOrders = orderItems.filter(item => item.orders.shipped_at).length;
    const deliveredOrders = orderItems.filter(item => item.orders.delivered_at).length;

    res.json({
      ...metrics,
      totalQuantity,
      uniqueOrders: uniqueOrders.size,
      fulfillmentRate: uniqueOrders.size > 0 ? (deliveredOrders / uniqueOrders.size) * 100 : 0,
      shippingRate: uniqueOrders.size > 0 ? (shippedOrders / uniqueOrders.size) * 100 : 0
    });
  } catch (error) {
    console.error('Error fetching vendor metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vendor revenue trends
router.get('/vendor/:vendorId/revenue-trends', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { period = 'daily', start_date, end_date } = req.query;

    if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    const dateFilter = buildDateFilter(start_date, end_date);

    // Get vendor's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('vendor_id', vendorId);

    if (productsError) throw productsError;

    const productIds = products.map(p => p.id);

    const { data: revenueData, error } = await supabase
      .from('order_items')
      .select(`
        total_price,
        orders!inner(created_at, status)
      `)
      .in('product_id', productIds)
      .in('orders.status', ['paid', 'fulfilled', 'shipped', 'delivered'])
      .gte('orders.created_at', dateFilter.gte || '2020-01-01')
      .lte('orders.created_at', dateFilter.lte || new Date().toISOString());

    if (error) throw error;

    // Group by time period (similar to system-wide)
    const groupedRevenue = revenueData.reduce((acc, item) => {
      const date = new Date(item.orders.created_at);
      let key;

      switch (period) {
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default: // daily
          key = date.toISOString().split('T')[0];
      }

      acc[key] = (acc[key] || 0) + item.total_price;
      return acc;
    }, {});

    const trends = Object.entries(groupedRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    res.json({ trends, period });
  } catch (error) {
    console.error('Error fetching vendor revenue trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vendor's top products
router.get('/vendor/:vendorId/top-products', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { limit = 10, start_date, end_date } = req.query;

    if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    const dateFilter = buildDateFilter(start_date, end_date);

    const { data: topProducts, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        total_price,
        products!inner(title, id, vendor_id)
      `)
      .eq('products.vendor_id', vendorId)
      .gte('orders.created_at', dateFilter.gte || '2020-01-01')
      .lte('orders.created_at', dateFilter.lte || new Date().toISOString())
      .order('total_price', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    // Aggregate by product (similar to system-wide)
    const productStats = topProducts.reduce((acc, item) => {
      const productId = item.products.id;
      const product = item.products;

      if (!acc[productId]) {
        acc[productId] = {
          productId,
          productName: product.title,
          totalRevenue: 0,
          totalQuantity: 0
        };
      }

      acc[productId].totalRevenue += item.total_price;
      acc[productId].totalQuantity += item.quantity;

      return acc;
    }, {});

    const result = Object.values(productStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, parseInt(limit));

    res.json(result);
  } catch (error) {
    console.error('Error fetching vendor top products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== PRODUCT PERFORMANCE ANALYTICS =====

// Get product performance metrics
router.get('/product/:productId/performance', async (req, res) => {
  try {
    const { productId } = req.params;
    const { start_date, end_date } = req.query;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const dateFilter = buildDateFilter(start_date, end_date);

    const { data: productData, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        total_price,
        unit_price,
        orders!inner(created_at, status)
      `)
      .eq('product_id', productId)
      .in('orders.status', ['paid', 'fulfilled', 'shipped', 'delivered'])
      .gte('orders.created_at', dateFilter.gte || '2020-01-01')
      .lte('orders.created_at', dateFilter.lte || new Date().toISOString());

    if (error) throw error;

    const totalRevenue = productData.reduce((sum, item) => sum + item.total_price, 0);
    const totalQuantity = productData.reduce((sum, item) => sum + item.quantity, 0);
    const orderCount = productData.length;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    const averageUnitPrice = productData.length > 0
      ? productData.reduce((sum, item) => sum + item.unit_price, 0) / productData.length
      : 0;

    res.json({
      totalRevenue,
      totalQuantity,
      orderCount,
      averageOrderValue,
      averageUnitPrice,
      salesVelocity: orderCount > 0 ? totalQuantity / orderCount : 0
    });
  } catch (error) {
    console.error('Error fetching product performance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== GEOGRAPHIC AND DEMOGRAPHIC INSIGHTS =====

// Get geographic sales distribution
router.get('/system/geographic', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const dateFilter = buildDateFilter(start_date, end_date);

    // This would require shipping addresses in orders table
    // For now, return placeholder structure
    const geographicData = [
      { region: 'North America', revenue: 0, orders: 0 },
      { region: 'Europe', revenue: 0, orders: 0 },
      { region: 'Asia', revenue: 0, orders: 0 },
      { region: 'Other', revenue: 0, orders: 0 }
    ];

    res.json(geographicData);
  } catch (error) {
    console.error('Error fetching geographic data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer demographics
router.get('/system/demographics', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const dateFilter = buildDateFilter(start_date, end_date);

    // This would require customer profile data
    // For now, return placeholder structure
    const demographicData = {
      ageGroups: [
        { range: '18-24', count: 0 },
        { range: '25-34', count: 0 },
        { range: '35-44', count: 0 },
        { range: '45+', count: 0 }
      ],
      topLocations: []
    };

    res.json(demographicData);
  } catch (error) {
    console.error('Error fetching demographic data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== EXPORT ENDPOINTS =====

// Export analytics data as CSV
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { start_date, end_date, vendor_id } = req.query;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-analytics.csv"`);

    let data = [];

    switch (type) {
      case 'revenue-trends':
        const trendsResponse = vendor_id
          ? await supabase.from('analytics').select('*').eq('vendor_id', vendor_id).eq('type', 'revenue_trends')
          : await supabase.from('analytics').select('*').eq('type', 'system_revenue_trends');
        data = trendsResponse.data || [];
        break;
      case 'top-products':
        const productsResponse = vendor_id
          ? await supabase.from('analytics').select('*').eq('vendor_id', vendor_id).eq('type', 'top_products')
          : await supabase.from('analytics').select('*').eq('type', 'system_top_products');
        data = productsResponse.data || [];
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    // Convert to CSV format
    if (data.length > 0) {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).join(','));
      res.send(`${headers}\n${rows.join('\n')}`);
    } else {
      res.send('No data available\n');
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;