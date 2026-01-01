import express from 'express';
import fetch from 'node-fetch';
import { supabase } from './supabaseClient.js';
const router = express.Router();

// PayPal configuration
const PAYPAL_API = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  production: 'https://api-m.paypal.com'
};

const NODE_ENV = (process.env.NODE_ENV || process.env.VITE_NODE_ENV || 'development').toLowerCase();
const ENV = NODE_ENV === 'production' || NODE_ENV === 'live' ? 'production' : 'sandbox';

const PAYPAL_CLIENT_ID = process.env.VITE_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.VITE_PAYPAL_SECRET || process.env.PAYPAL_SECRET;

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error('Missing PayPal credentials for verification');
  throw new Error('PayPal configuration is incomplete');
}

async function generateAccessToken() {
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
      throw new Error(`PayPal token error: ${data.error_description}`);
    }

    return data.access_token;
  } catch (err) {
    console.error('generateAccessToken error:', err.message);
    throw err;
  }
}

// Verify PayPal order/payment status
router.get('/verify-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log('Verifying PayPal order:', orderId);

    // Get order details from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, paypal_order_id, paypal_capture_id, total_amount, metadata')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.paypal_order_id) {
      return res.status(400).json({ error: 'No PayPal order ID associated with this order' });
    }

    const accessToken = await generateAccessToken();

    // Get PayPal order details
    const orderUrl = `${PAYPAL_API[ENV]}/v2/checkout/orders/${order.paypal_order_id}`;

    const orderResponse = await fetch(orderUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const paypalOrder = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error('PayPal order verification failed:', paypalOrder);
      return res.status(orderResponse.status).json({
        error: 'Failed to verify PayPal order',
        details: paypalOrder
      });
    }

    // Verify order amounts match
    const paypalAmount = parseFloat(paypalOrder.purchase_units?.[0]?.amount?.value || 0);
    const dbAmount = (order.total_amount || 0) / 100; // Convert cents to dollars

    const amountMatch = Math.abs(paypalAmount - dbAmount) < 0.01; // Allow for small floating point differences

    // Check payment status
    const paymentStatus = paypalOrder.status; // APPROVED, COMPLETED, etc.
    const captureStatus = paypalOrder.purchase_units?.[0]?.payments?.captures?.[0]?.status;

    const verificationResult = {
      order_id: order.id,
      paypal_order_id: order.paypal_order_id,
      paypal_capture_id: order.paypal_capture_id,
      order_status: order.status,
      paypal_order_status: paymentStatus,
      paypal_capture_status: captureStatus,
      amount_match: amountMatch,
      paypal_amount: paypalAmount,
      database_amount: dbAmount,
      verification_timestamp: new Date().toISOString(),
      is_valid: amountMatch && (paymentStatus === 'COMPLETED' || paymentStatus === 'APPROVED')
    };

    // Log verification for audit
    await supabase.from('payment_verifications').insert({
      order_id: order.id,
      paypal_order_id: order.paypal_order_id,
      verification_result: verificationResult,
      verified_at: new Date().toISOString()
    });

    res.json(verificationResult);

  } catch (error) {
    console.error('Order verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify PayPal capture/payment
router.get('/verify-capture/:captureId', async (req, res) => {
  try {
    const { captureId } = req.params;

    console.log('Verifying PayPal capture:', captureId);

    const accessToken = await generateAccessToken();

    // Get PayPal capture details
    const captureUrl = `${PAYPAL_API[ENV]}/v2/payments/captures/${captureId}`;

    const captureResponse = await fetch(captureUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const paypalCapture = await captureResponse.json();

    if (!captureResponse.ok) {
      console.error('PayPal capture verification failed:', paypalCapture);
      return res.status(captureResponse.status).json({
        error: 'Failed to verify PayPal capture',
        details: paypalCapture
      });
    }

    // Find associated order
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, paypal_order_id, total_amount')
      .eq('paypal_capture_id', captureId)
      .single();

    const verificationResult = {
      capture_id: captureId,
      capture_status: paypalCapture.status,
      amount: paypalCapture.amount,
      order_id: order?.id || null,
      order_status: order?.status || null,
      verification_timestamp: new Date().toISOString(),
      is_valid: paypalCapture.status === 'COMPLETED'
    };

    // Log verification
    if (order) {
      await supabase.from('payment_verifications').insert({
        order_id: order.id,
        paypal_capture_id: captureId,
        verification_result: verificationResult,
        verified_at: new Date().toISOString()
      });
    }

    res.json(verificationResult);

  } catch (error) {
    console.error('Capture verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment status summary for order
router.get('/payment-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        paypal_order_id,
        paypal_capture_id,
        total_amount,
        metadata,
        created_at,
        updated_at
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get recent verification logs
    const { data: verifications } = await supabase
      .from('payment_verifications')
      .select('*')
      .eq('order_id', orderId)
      .order('verified_at', { ascending: false })
      .limit(5);

    // Get status history
    const { data: statusHistory } = await supabase
      .from('order_status_history')
      .select('old_status, new_status, created_at, change_reason')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(10);

    const paymentStatus = {
      order_id: order.id,
      order_status: order.status,
      paypal_order_id: order.paypal_order_id,
      paypal_capture_id: order.paypal_capture_id,
      total_amount: order.total_amount,
      payment_received: order.status === 'paid' || order.status === 'confirmed' || order.status === 'processing' || order.status === 'packed' || order.status === 'shipped' || order.status === 'delivered',
      metadata: order.metadata,
      created_at: order.created_at,
      updated_at: order.updated_at,
      recent_verifications: verifications || [],
      status_history: statusHistory || []
    };

    res.json(paymentStatus);

  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch verification for multiple orders (admin endpoint)
router.post('/batch-verify', express.json(), async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'orderIds array is required' });
    }

    if (orderIds.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 orders can be verified at once' });
    }

    const results = [];

    for (const orderId of orderIds) {
      try {
        // Get order details
        const { data: order } = await supabase
          .from('orders')
          .select('id, status, paypal_order_id, paypal_capture_id, total_amount')
          .eq('id', orderId)
          .single();

        if (!order) {
          results.push({
            order_id: orderId,
            error: 'Order not found'
          });
          continue;
        }

        // Basic verification based on database state
        const isValid = order.paypal_order_id && order.paypal_capture_id &&
                       (order.status === 'paid' || order.status === 'confirmed' ||
                        order.status === 'processing' || order.status === 'packed' ||
                        order.status === 'shipped' || order.status === 'delivered');

        results.push({
          order_id: order.id,
          paypal_order_id: order.paypal_order_id,
          paypal_capture_id: order.paypal_capture_id,
          order_status: order.status,
          total_amount: order.total_amount,
          is_valid: isValid,
          verified_at: new Date().toISOString()
        });

      } catch (orderError) {
        results.push({
          order_id: orderId,
          error: orderError.message
        });
      }
    }

    res.json({
      total_orders: orderIds.length,
      verified_orders: results.filter(r => !r.error).length,
      results: results
    });

  } catch (error) {
    console.error('Batch verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;