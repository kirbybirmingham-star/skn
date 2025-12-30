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
  orderItems?.forEach((item, i) => {
    console.log(`Item ${i + 1}:`, {
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    });
  });

  if (!orderItems || orderItems.length === 0) {
    console.log('No orders found');
    process.exit(0);
  }

  // Get order details
  const orderIds = [...new Set(orderItems.map(item => item.order_id))];
  
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('*')
    .in('id', orderIds)
    .limit(1);

  console.log('\n=== ORDERS SCHEMA ===');
  if (ordersErr) {
    console.log('Error:', ordersErr.message);
  } else if (orders && orders.length > 0) {
    console.log('Columns:', Object.keys(orders[0]));
    console.log('Sample order:', orders[0]);
  }

  // Get user emails
  const userIds = [...new Set(orderItems.map(item => {
    const order = orders?.find(o => o.id === item.order_id);
    return order?.user_id;
  }).filter(Boolean))];

  const { data: users } = await supabase
    .from('auth.users')
    .select('id, email')
    .in('id', userIds);

  console.log('\n=== USERS ===');
  console.log('Users found:', users?.length);
  users?.forEach((user, i) => {
    console.log(`User ${i + 1}:`, user);
  });

  process.exit(0);
}, 1000);
