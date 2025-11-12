import express from 'express';
import crypto from 'crypto';
const router = express.Router();

// PayPal webhook verification
function verifyPayPalWebhook(req) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const headers = req.headers;
  
  try {
    const paypalSignature = headers['paypal-transmission-sig'];
    const transmissionId = headers['paypal-transmission-id'];
    const certUrl = headers['paypal-cert-url'];
    const authAlgo = headers['paypal-auth-algo'];
    const transmissionTime = headers['paypal-transmission-time'];

    // Construct the validation message
    const validationMessage = `${transmissionId}|${transmissionTime}|${webhookId}|${JSON.stringify(req.body)}`;
    
    // Here you would verify the signature with PayPal's certificate
    // For production, implement full signature verification
    // This is a simplified check
    return true;
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return false;
  }
}

router.post('/paypal-webhook', express.json(), async (req, res) => {
  try {
    // Verify the webhook signature
    const isVerified = verifyPayPalWebhook(req);
    if (!isVerified) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body;
    const eventType = event.event_type;

    // Handle different webhook events
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment was captured successfully
        const paymentId = event.resource.id;
        const orderId = event.resource.supplementary_data.related_ids.order_id;
        
        // Update your database with the payment status
        // await updatePaymentStatus(orderId, 'completed');
        
        console.log(`Payment ${paymentId} for order ${orderId} was completed`);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        // Payment was denied
        console.log('Payment was denied:', event.resource.id);
        // Handle payment denial (e.g., update order status, notify customer)
        break;

      case 'PAYMENT.CAPTURE.PENDING':
        // Payment is pending
        console.log('Payment is pending:', event.resource.id);
        // Handle pending payment
        break;

      case 'CHECKOUT.ORDER.COMPLETED':
        // Order completed
        console.log('Order completed:', event.resource.id);
        // Fulfill the order
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;