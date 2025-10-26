import express from 'express';
import fetch from 'node-fetch';
const router = express.Router();

const PAYPAL_API = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  production: 'https://api-m.paypal.com'
};

// Determine environment from NODE_ENV or VITE_NODE_ENV. Default to sandbox for safety.
const NODE_ENV = (process.env.NODE_ENV || process.env.VITE_NODE_ENV || 'development').toLowerCase();
const ENV = NODE_ENV === 'production' || NODE_ENV === 'live' ? 'production' : 'sandbox';

// Support both VITE_ prefixed and non-prefixed env var names (local dev vs build).
const PAYPAL_CLIENT_ID = process.env.VITE_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.VITE_PAYPAL_SECRET || process.env.PAYPAL_SECRET;

// Debug environment variables (redact secrets)
console.log('PayPal env:', { NODE_ENV, ENV, PAYPAL_CLIENT_ID: PAYPAL_CLIENT_ID ? '\u2713' : '\u2717' });

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error('Missing PayPal credentials. Check .env (VITE_PAYPAL_CLIENT_ID/VITE_PAYPAL_SECRET or PAYPAL_CLIENT_ID/PAYPAL_SECRET)');
  // Throw to fail fast during startup so developer notices config issue.
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

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    if (!res.ok) {
      // Include PayPal response body in the error to help debugging (but don't log secrets)
      console.error('Failed to obtain PayPal token', { status: res.status, body: data });
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

// Create order endpoint — returns PayPal order id and links or an informative error
router.post('/create-order', express.json(), async (req, res) => {
  try {
    console.log('Received create-order request');
    const { cartItems } = req.body || {};

    // Debug request
    console.log('Cart Items:', JSON.stringify(cartItems, null, 2));

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      console.error('Invalid cart items:', cartItems);
      return res.status(400).send(JSON.stringify({ error: 'cartItems required and must be a non-empty array' }));
    }

    // Defensive validation of items
    for (const item of cartItems) {
      if (!item?.variant || typeof item.quantity !== 'number') {
        console.error('Invalid item:', item);
        return res.status(400).send(JSON.stringify({ error: 'Each cart item must have a variant and numeric quantity' }));
      }
    }

    console.log('Generating PayPal access token...');
    const accessToken = await generateAccessToken();
    if (!accessToken) {
      console.error('Failed to generate PayPal access token');
      return res.status(500).send(JSON.stringify({ error: 'Failed to initialize payment processing' }));
    }
    console.log('Access token generated successfully');

    const orderTotal = cartItems.reduce((total, item) => {
      const priceCents = item.variant.sale_price_in_cents ?? item.variant.price_in_cents ?? 0;
      const price = priceCents / 100;
      return total + price * item.quantity;
    }, 0);

    if (orderTotal <= 0) {
      return res.status(400).json({ error: 'Invalid order total amount' });
    }

    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `order_${Date.now()}`,
          description: 'SKN Bridge Trade Purchase',
          amount: {
            currency_code: 'USD',
            value: orderTotal.toFixed(2),
            breakdown: {
              item_total: { 
                currency_code: 'USD', 
                value: orderTotal.toFixed(2) 
              }
            }
          },
          items: cartItems.map(item => {
            const unitPrice = ((item.variant.sale_price_in_cents ?? item.variant.price_in_cents ?? 0) / 100).toFixed(2);
            return {
              name: item.product?.title || 'Item',
              description: item.variant?.title || '',
              sku: item.variant?.id || '',
              unit_amount: { 
                currency_code: 'USD', 
                value: unitPrice
              },
              quantity: String(item.quantity),
              category: 'PHYSICAL_GOODS'
            };
          }),
          shipping_preference: 'GET_FROM_FILE'
        }
      ],
      application_context: {
        brand_name: 'SKN Bridge Trade',
        shipping_preference: 'GET_FROM_FILE',
        user_action: 'PAY_NOW',
        return_url: 'https://skn.onrender.com/success',
        cancel_url: 'https://skn.onrender.com/cart'
      }
    };

    const url = `${PAYPAL_API[ENV]}/v2/checkout/orders`;
    console.log('Creating PayPal order at', url, 'payload total:', orderTotal.toFixed(2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    if (!response.ok) {
      // Per PayPal docs, error responses contain useful details in the body.
      console.error('PayPal create-order failed', { status: response.status, body: data });
      // Map certain PayPal status codes to appropriate responses.
      const status = response.status >= 500 ? 502 : 400;
      return res.status(status).json({ error: data?.message || data });
    }

    console.log('PayPal create-order success, id:', data.id);
    return res.json({ id: data.id, links: data.links });
  } catch (err) {
    console.error('Server create-order error:', err && (err.stack || err));
    // If err.details exists (from generateAccessToken), surface it for debugging in dev only
    const payload = { error: err.message || 'Server error' };
    if (process.env.NODE_ENV !== 'production' && err.details) payload.details = err.details;
    return res.status(500).json(payload);
  }
});

export default router;
