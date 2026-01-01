import express from 'express';
import crypto from 'crypto';
import { supabase } from './supabaseClient.js';
import { handleStatusChange } from './orderStatusManager.js';
const router = express.Router();

// PayPal webhook signature verification
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

// Verify PayPal webhook signature
function verifyPayPalWebhook(req) {
  try {
    const signature = req.headers['paypal-transmission-signature'];
    const signatureAlgorithm = req.headers['paypal-transmission-sig-alg'];
    const transmissionId = req.headers['paypal-transmission-id'];
    const timestamp = req.headers['paypal-transmission-time'];

    if (!signature || !PAYPAL_WEBHOOK_ID) {
      console.error('Missing webhook signature or webhook ID');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', PAYPAL_WEBHOOK_ID)
      .update(transmissionId + '|' + timestamp + '|' + JSON.stringify(req.body))
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
}

// PayPal webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!verifyPayPalWebhook(req)) {
        console.error('Invalid PayPal webhook signature');
        return res.status(400).send('INVALID_SIGNATURE');
      }
    }

    const event = req.body;
    console.log('Received PayPal webhook:', event.event_type, event.id);

    // Log webhook event
    await supabase.from('webhook_logs').insert({
      provider: 'paypal',
      event_type: event.event_type,
      event_id: event.id,
      payload: event,
      processed_at: new Date().toISOString()
    });

    // Handle different webhook events
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentCaptureDenied(event);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentCaptureRefunded(event);
        break;

      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(event);
        break;

      case 'CHECKOUT.ORDER.COMPLETED':
        await handleOrderCompleted(event);
        break;

      default:
        console.log('Unhandled webhook event type:', event.event_type);
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('INTERNAL_ERROR');
  }
});

// Handle payment capture completed
async function handlePaymentCaptureCompleted(event) {
  try {
    const capture = event.resource;
    const orderId = capture.supplementary_data?.related_ids?.order_id;

    if (!orderId) {
      console.error('No order ID in payment capture webhook');
      return;
    }

    console.log('Processing payment capture for order:', orderId);

    // Find and update order
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status, paypal_order_id')
      .eq('paypal_order_id', orderId)
      .single();

    if (error || !order) {
      console.error('Order not found for PayPal order ID:', orderId);
      return;
    }

    if (order.status === 'pending') {
      await handleStatusChange(order.id, 'pending', 'paid', {
        reason: 'Payment captured via PayPal webhook',
        paypal_capture_id: capture.id,
        paypal_transaction_info: capture,
        webhook_event_id: event.id,
        automatic: true
      });

      // Update order metadata
      await supabase
        .from('orders')
        .update({
          paypal_capture_id: capture.id,
          metadata: supabase.functions.append(
            supabase.functions.select('metadata').eq('id', order.id).single().data?.metadata || {},
            {
              paypal_webhook_capture: capture,
              capture_timestamp: new Date().toISOString()
            }
          )
        })
        .eq('id', order.id);

      console.log(`Order ${order.id} automatically updated to paid via webhook`);
    }

  } catch (error) {
    console.error('Error handling payment capture completed:', error);
  }
}

// Handle payment capture denied
async function handlePaymentCaptureDenied(event) {
  try {
    const capture = event.resource;
    const orderId = capture.supplementary_data?.related_ids?.order_id;

    if (!orderId) return;

    const { data: order } = await supabase
      .from('orders')
      .select('id, status')
      .eq('paypal_order_id', orderId)
      .single();

    if (order && order.status === 'pending') {
      await handleStatusChange(order.id, 'pending', 'cancelled', {
        reason: 'Payment denied by PayPal',
        paypal_capture_id: capture.id,
        denial_reason: capture.status_details?.reason,
        webhook_event_id: event.id,
        automatic: true
      });

      console.log(`Order ${order.id} cancelled due to payment denial`);
    }

  } catch (error) {
    console.error('Error handling payment capture denied:', error);
  }
}

// Handle payment capture refunded
async function handlePaymentCaptureRefunded(event) {
  try {
    const refund = event.resource;
    const captureId = refund.id; // This is the refund ID, need to find original capture

    // Find order by capture ID
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, paypal_capture_id')
      .eq('paypal_capture_id', refund.supplementary_data?.related_ids?.capture_id)
      .single();

    if (order && ['paid', 'delivered'].includes(order.status)) {
      await handleStatusChange(order.id, order.status, 'refunded', {
        reason: 'Payment refunded via PayPal webhook',
        paypal_refund_id: refund.id,
        refund_amount: refund.amount?.value,
        webhook_event_id: event.id,
        automatic: true
      });

      console.log(`Order ${order.id} marked as refunded via webhook`);
    }

  } catch (error) {
    console.error('Error handling payment capture refunded:', error);
  }
}

// Handle order approved (when customer approves PayPal order)
async function handleOrderApproved(event) {
  try {
    const paypalOrder = event.resource;
    const orderId = paypalOrder.id;

    const { data: order } = await supabase
      .from('orders')
      .select('id, status')
      .eq('paypal_order_id', orderId)
      .single();

    if (order && order.status === 'pending') {
      await handleStatusChange(order.id, 'pending', 'confirmed', {
        reason: 'PayPal order approved by customer',
        webhook_event_id: event.id,
        automatic: true
      });

      console.log(`Order ${order.id} confirmed via PayPal webhook`);
    }

  } catch (error) {
    console.error('Error handling order approved:', error);
  }
}

// Handle order completed (when PayPal order is fully processed)
async function handleOrderCompleted(event) {
  try {
    const paypalOrder = event.resource;
    const orderId = paypalOrder.id;

    // This might be a duplicate of payment capture, but ensure order is marked as paid
    const { data: order } = await supabase
      .from('orders')
      .select('id, status')
      .eq('paypal_order_id', orderId)
      .single();

    if (order && order.status === 'confirmed') {
      await handleStatusChange(order.id, 'confirmed', 'paid', {
        reason: 'PayPal order completed',
        webhook_event_id: event.id,
        automatic: true
      });

      console.log(`Order ${order.id} marked as paid via order completed webhook`);
    }

  } catch (error) {
    console.error('Error handling order completed:', error);
  }
}

// Payment verification endpoint
router.get('/verify-payment/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status, paypal_order_id, paypal_capture_id, created_at, updated_at')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If we have a PayPal capture ID, verify with PayPal
    if (order.paypal_capture_id) {
      try {
        // In a real implementation, you'd call PayPal's API to verify capture status
        // For now, return order status
        res.json({
          order_id: order.id,
          paypal_order_id: order.paypal_order_id,
          paypal_capture_id: order.paypal_capture_id,
          order_status: order.status,
          payment_verified: order.status === 'paid',
          verification_timestamp: new Date().toISOString()
        });
      } catch (paypalError) {
        console.error('PayPal verification error:', paypalError);
        res.json({
          order_id: order.id,
          order_status: order.status,
          payment_verified: false,
          error: 'PayPal verification failed'
        });
      }
    } else {
      res.json({
        order_id: order.id,
        order_status: order.status,
        paypal_order_id: order.paypal_order_id,
        payment_verified: false,
        message: 'No PayPal capture ID available'
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;