import { createClient } from '@supabase/supabase-js';
import { createPayout } from './commission-payouts.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase not configured for payouts. Some operations will fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const COMMISSION_RATE = 0.1; // 10%

export async function processPayouts() {
  try {
    // 1. Get all completed orders that have not been paid out yet
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*, vendors(*)))')
      .eq('status', 'completed')
      .eq('payout_status', 'pending');

    if (ordersError) {
      throw new Error(`Error fetching orders: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) {
      console.log('No pending payouts to process.');
      return;
    }

    // 2. Calculate the commission for each vendor
    const vendorPayouts = {};

    for (const order of orders) {
      for (const item of order.order_items) {
        const vendor = item.products.vendors;
        const vendorId = vendor.id;
        const orderTotal = item.quantity * item.price_in_cents;
        const commission = orderTotal * COMMISSION_RATE;
        const vendorAmount = orderTotal - commission;

        if (!vendorPayouts[vendorId]) {
          vendorPayouts[vendorId] = {
            vendor: vendor,
            amount: 0,
            orders: []
          };
        }

        vendorPayouts[vendorId].amount += vendorAmount;
        vendorPayouts[vendorId].orders.push(order.id);
      }
    }

    // 3. Create the payout items
    const payoutItems = Object.values(vendorPayouts).map(payout => ({
      receiver: payout.vendor.metadata.contact_email,
      amount: (payout.amount / 100).toFixed(2) // Convert to dollars
    }));

    // 4. Create the payout
    const payoutResult = await createPayout(payoutItems);

    // 5. Update the orders to mark them as paid
    const orderIds = Object.values(vendorPayouts).flatMap(payout => payout.orders);
    const { error: updateError } = await supabase
      .from('orders')
      .update({ payout_status: 'paid', payout_id: payoutResult.batch_header.payout_batch_id })
      .in('id', orderIds);

    if (updateError) {
      throw new Error(`Error updating orders: ${updateError.message}`);
    }

    console.log('Payouts processed successfully.');
  } catch (err) {
    console.error('Error processing payouts:', err);
  }
}
