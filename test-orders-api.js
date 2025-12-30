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

  console.log('=== VENDOR ORDER ITEMS ===');
  if (ordersError) {
    console.log('Error:', ordersError.message);
    process.exit(1);
  }
  console.log('Items found:', orderItems.length);
  orderItems.forEach((item, i) => {
    console.log(`  Item ${i + 1}: order_id=${item.order_id}, quantity=${item.quantity}, unit_price=${item.unit_price}`);
  });

  if (!orderItems || orderItems.length === 0) {
    console.log('No orders found');
    process.exit(0);
  }

  // Get order details
  const orderIds = [...new Set(orderItems.map(item => item.order_id))];
  
  const { data: orders, error: ordersDataError } = await supabase
    .from('orders')
    .select('id, user_id, status, total_amount, created_at')
    .in('id', orderIds);

  console.log('\n=== ORDERS ===');
  if (ordersDataError) {
    console.log('Error:', ordersDataError.message);
  } else {
    console.log('Orders found:', orders?.length || 0);
    orders?.forEach((order, i) => {
      console.log(`  Order ${i + 1}: id=${order.id}, user_id=${order.user_id}, status=${order.status}, total=${order.total_amount}`);
    });
  }

  const orderMap = {};
  orders?.forEach(order => {
    orderMap[order.id] = order;
  });

  // Get user emails
  const userIds = [...new Set(orderItems.map(item => {
    const order = orderMap[item.order_id];
    return order?.user_id;
  }).filter(Boolean))];

  console.log('\n=== FETCHING USERS ===');
  console.log('User IDs to fetch:', userIds);

  const { data: users, error: usersError } = await supabase
    .from('auth.users')
    .select('id, email')
    .in('id', userIds);

  console.log('\n=== USERS ===');
  if (usersError) {
    console.log('Error:', usersError.message);
  } else {
    console.log('Users found:', users?.length || 0);
    users?.forEach((user) => {
      console.log(`  User: id=${user.id.slice(0, 8)}..., email=${user.email}`);
    });
  }

  const userMap = {};
  users?.forEach(user => {
    userMap[user.id] = user.email;
  });

  // Build enriched response
  const enrichedOrders = orderItems.map(item => {
    const order = orderMap[item.order_id];
    const userEmail = userMap[order?.user_id] || 'Unknown';

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
      userId: order?.user_id
    };
  });

  console.log('\n=== ENRICHED ORDERS (what API will return) ===');
  console.log(JSON.stringify(enrichedOrders, null, 2));

  process.exit(0);
}, 1000);
