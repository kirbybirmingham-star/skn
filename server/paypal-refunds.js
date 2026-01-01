import express from 'express';
import fetch from 'node-fetch';
import { supabase } from './supabaseClient.js';
import { handleStatusChange } from './orderStatusManager.js';
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
  console.error('Missing PayPal credentials. Check .env');
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

// Refund PayPal capture
router.post('/refund-capture/:captureId', express.json(), async (req, res) => {
  try {
    const { captureId } = req.params;
    const { amount, reason, orderId } = req.body;

    console.log('Processing PayPal refund for capture:', captureId);

    if (!captureId) {
      return res.status(400).json({ error: 'Capture ID is required' });
    }

    const accessToken = await generateAccessToken();

    const refundUrl = `${PAYPAL_API[ENV]}/v2/payments/captures/${captureId}/refund`;

    const refundPayload = {};
    if (amount) {
      refundPayload.amount = {
        value: amount.toFixed(2),
        currency_code: 'USD'
      };
    }

    const response = await fetch(refundUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `refund-${captureId}-${Date.now()}`
      },
      body: JSON.stringify(refundPayload)
    });

    const refundData = await response.json();

    if (!response.ok) {
      console.error('PayPal refund failed:', refundData);
      return res.status(response.status).json({
        error: refundData.message || 'Refund failed',
        details: refundData
      });
    }

    console.log('PayPal refund successful:', refundData.id);

    // Update order status if full refund
    if (orderId) {
      try {
        const { data: order } = await supabase
          .from('orders')
          .select('id, status, total_amount')
          .eq('id', orderId)
          .single();

        if (order && order.status === 'paid') {
          // Check if this is a full refund
          const refundAmount = amount || (order.total_amount / 100);

          if (refundAmount >= (order.total_amount / 100)) {
            await handleStatusChange(order.id, 'paid', 'refunded', {
              reason: reason || 'PayPal refund processed',
              paypal_refund_id: refundData.id,
              refund_amount: refundAmount,
              automatic: false
            });
          }
        }
      } catch (statusError) {
        console.error('Failed to update order status after refund:', statusError);
      }
    }

    res.json({
      refund_id: refundData.id,
      status: refundData.status,
      amount: refundData.amount,
      create_time: refundData.create_time
    });

  } catch (err) {
    console.error('Refund capture error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get refund details
router.get('/refund/:refundId', async (req, res) => {
  try {
    const { refundId } = req.params;

    const accessToken = await generateAccessToken();

    const response = await fetch(`${PAYPAL_API[ENV]}/v2/payments/refunds/${refundId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const refundData = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: refundData.message });
    }

    res.json(refundData);

  } catch (err) {
    console.error('Get refund error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process refund through order management system
router.post('/process-order-refund/:orderId', express.json(), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { refundAmount, reason, approvedBy } = req.body;

    console.log('Processing order refund for:', orderId);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, paypal_capture_id, total_amount')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.paypal_capture_id) {
      return res.status(400).json({ error: 'No PayPal capture ID found for this order' });
    }

    // Process PayPal refund
    const accessToken = await generateAccessToken();

    const refundPayload = {};
    if (refundAmount && refundAmount < (order.total_amount / 100)) {
      refundPayload.amount = {
        value: refundAmount.toFixed(2),
        currency_code: 'USD'
      };
    } // Full refund if no amount specified

    const refundUrl = `${PAYPAL_API[ENV]}/v2/payments/captures/${order.paypal_capture_id}/refund`;

    const response = await fetch(refundUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `refund-${orderId}-${Date.now()}`
      },
      body: JSON.stringify(refundPayload)
    });

    const refundData = await response.json();

    if (!response.ok) {
      console.error('PayPal refund failed:', refundData);
      return res.status(response.status).json({
        error: refundData.message || 'Refund failed',
        details: refundData
      });
    }

    // Update refund request status
    const refundAmountValue = refundAmount || (order.total_amount / 100);

    await supabase
      .from('refund_requests')
      .update({
        status: 'processed',
        amount_approved: Math.round(refundAmountValue * 100), // Convert to cents
        paypal_refund_id: refundData.id,
        processed_at: new Date().toISOString(),
        notes: reason
      })
      .eq('order_id', orderId);

    // Update order status
    await handleStatusChange(orderId, order.status, 'refunded', {
      reason: reason || 'Refund processed through PayPal',
      paypal_refund_id: refundData.id,
      refund_amount: refundAmountValue,
      approved_by: approvedBy,
      automatic: false
    });

    res.json({
      success: true,
      refund_id: refundData.id,
      order_id: orderId,
      amount: refundAmountValue,
      status: refundData.status
    });

  } catch (err) {
    console.error('Process order refund error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;