import express from 'express';
import fetch from 'node-fetch';
import { supabase } from './supabaseClient.js';
import { handleStatusChange } from './orderStatusManager.js';
const router = express.Router();

// Share environment and API config with create-order route
const PAYPAL_API = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  production: 'https://api-m.paypal.com'
};

const NODE_ENV = (process.env.NODE_ENV || process.env.VITE_NODE_ENV || 'development').toLowerCase();
const ENV = NODE_ENV === 'production' || NODE_ENV === 'live' ? 'production' : 'sandbox';

// Support both VITE_ prefixed and non-prefixed env var names (local dev vs build)
const PAYPAL_CLIENT_ID = process.env.VITE_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.VITE_PAYPAL_SECRET || process.env.PAYPAL_SECRET;

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error('Missing PayPal credentials. Check .env (VITE_PAYPAL_CLIENT_ID/VITE_PAYPAL_SECRET or PAYPAL_CLIENT_ID/PAYPAL_SECRET)');
  // Throw to fail fast during startup so developer notices config issue
  throw new Error('PayPal configuration is incomplete');
}

async function generateAccessToken() {
  // Log the client ID to verify it's loaded, but redact most of it.
  const redactedClientId = PAYPAL_CLIENT_ID 
    ? `${PAYPAL_CLIENT_ID.substring(0, 8)}...${PAYPAL_CLIENT_ID.substring(PAYPAL_CLIENT_ID.length - 4)}`
    : 'NOT FOUND';
  console.log(`Generating token for PayPal Client ID: ${redactedClientId}`);

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const tokenUrl = `${PAYPAL_API[ENV]}/v1/oauth2/token`;
  try {
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const data = await res.json();

    if (!res.ok) {
      const errorDetails = data.error_description || JSON.stringify(data);
      console.error(`Failed to obtain PayPal token. Status: ${res.status}. PayPal says: "${errorDetails}"`);
      const err = new Error('Failed to obtain PayPal access token');
      err.details = { status: res.status, body: data };
      throw err;
    }

    if (!data.access_token) {
      console.error('PayPal token response missing access_token', data);
      const err = new Error('PayPal access token missing in response');
      err.details = data;
      throw err;
    }

    return data.access_token;
  } catch (err) {
    console.error('generateAccessToken error:', err.message || err);
    throw err;
  }
}

// Capture payment for completed order
router.post('/capture-order/:orderID', async (req, res) => {
  try {
    const { orderID } = req.params;

    console.log('Attempting to capture PayPal order:', orderID);

    const accessToken = await generateAccessToken();
    if (!accessToken) {
      console.error('Failed to generate PayPal access token');
      return res.status(500).send(JSON.stringify({ error: 'Failed to initialize payment processing' }));
    }

    const url = `${PAYPAL_API[ENV]}/v2/checkout/orders/${orderID}/capture`;
    console.log('Capturing PayPal order at:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `capture-${orderID}-${Date.now()}`
      }
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    if (!response.ok) {
      console.error('PayPal capture failed:', { status: response.status, body: data });
      return res.status(response.status).send(JSON.stringify({ error: data?.message || 'Payment capture failed' }));
    }

    console.log('PayPal capture success, order ID:', orderID);

    // Store comprehensive PayPal transaction details
    const paypalMetadata = {
      paypal_capture_id: data.id,
      paypal_transaction_info: {
        status: data.status,
        amount: data.amount,
        final_capture: data.final_capture,
        disbursement_mode: data.disbursement_mode,
        seller_receivable_breakdown: data.seller_receivable_breakdown,
        create_time: data.create_time,
        update_time: data.update_time
      },
      capture_timestamp: new Date().toISOString()
    };

    // Update order status to 'paid' after successful payment capture
    try {
      // Find the order by paypal_order_id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, status, metadata')
        .eq('paypal_order_id', orderID)
        .single();

      if (order && !orderError) {
        const existingMetadata = order.metadata || {};
        const updatedMetadata = { ...existingMetadata, ...paypalMetadata };

        if (order.status === 'pending') {
          // Automatically transition from pending to paid on successful payment
          await handleStatusChange(order.id, 'pending', 'paid', {
            reason: 'Payment captured successfully via PayPal',
            ...paypalMetadata,
            changed_by: 'system',
            automatic: true
          });

          // Update the order with PayPal capture details
          await supabase
            .from('orders')
            .update({
              status: 'paid',
              paypal_capture_id: data.id,
              metadata: updatedMetadata,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          console.log(`Order ${order.id} status updated to paid after successful payment capture`);
        } else if (order.status === 'paid') {
          // If already paid, just update the metadata
          await supabase
            .from('orders')
            .update({
              metadata: updatedMetadata,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          console.log(`Order ${order.id} payment metadata updated (already paid)`);
        }
      }
    } catch (statusError) {
      console.error('Failed to update order status after payment capture:', statusError);
      // Don't fail the payment capture for status update issues
      // Log the error for monitoring
      try {
        await supabase.from('error_logs').insert({
          service: 'paypal-capture',
          error_type: 'status_update_failed',
          error_message: statusError.message,
          metadata: { orderID, paypal_capture_id: data.id },
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Failed to log status update error:', logError);
      }
    }

    return res.send(JSON.stringify(data));
  } catch (err) {
    console.error('Server capture-order error:', err && (err.stack || err));
    const payload = { error: err.message || 'Server error' };
    if (process.env.NODE_ENV !== 'production' && err.details) payload.details = err.details;
    return res.status(500).send(JSON.stringify(payload));
  }
});

export default router;