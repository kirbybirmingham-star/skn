import dotenv from 'dotenv';
dotenv.config();

setTimeout(async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Test the exact query the endpoint uses
  const vendorId = '0f134cb6-9ee5-4e4d-ba50-528cb55d3ca3';

  // Get all order_items for this vendor
  const { data: orderItems, error: ordersError } = await supabase
    .from('order_items')
    .select(`
      id,
      order_id,
      product_id,
      variant_id,
      quantity,
      unit_price,
      total_price,
      metadata
    `)
    .eq('vendor_id', vendorId);

  if (ordersError) {
    console.log('Error fetching order items:', ordersError.message);
    process.exit(1);
  }

  if (!orderItems || orderItems.length === 0) {
    console.log('No orders found');
    process.exit(0);
  }

  // Get order details
  const orderIds = [...new Set(orderItems.map(item => item.order_id))];
  
  const { data: orders, error: ordersDataError } = await supabase
    .from('orders')
    .select('id, user_id, status, total_amount, created_at, metadata')
    .in('id', orderIds);

  if (ordersDataError) {
    console.log('Error fetching order details:', ordersDataError.message);
    process.exit(1);
  }

  const orderMap = {};
  orders?.forEach(order => {
    orderMap[order.id] = order;
  });

  // Build enriched response
  const enrichedOrders = orderItems.map(item => {
    const order = orderMap[item.order_id];
    const userEmail = order?.metadata?.payer_email || 'Unknown';

    return {
      id: item.id,
      orderId: item.order_id,
      itemId: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      status: order?.status || 'unknown',
      createdAt: order?.created_at,
      userEmail: userEmail,
      userId: order?.user_id,
      metadata: item.metadata
    };
  });

  console.log('=== ENRICHED ORDERS (what API will return) ===');
  console.log(JSON.stringify(enrichedOrders, null, 2));

  process.exit(0);
}, 1000);
