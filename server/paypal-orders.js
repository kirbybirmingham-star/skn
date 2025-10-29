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

// Check PayPal configuration
const missingVars = [];
if (!PAYPAL_CLIENT_ID) missingVars.push('PAYPAL_CLIENT_ID');
if (!PAYPAL_CLIENT_SECRET) missingVars.push('PAYPAL_SECRET');

if (missingVars.length > 0) {
  const message = `Missing PayPal credentials: ${missingVars.join(', ')}`;
  console.error(message);
  // Instead of throwing, we'll set an error state that routes can check
  module.exports.configError = message;
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

// Create order endpoint — returns PayPal order id and links or an informative error
router.post('/create-order', express.json(), async (req, res) => {
  try {
    console.log('Received create-order request');

    // Check if we have a configuration error
    if (module.exports.configError) {
      console.error('PayPal configuration error:', module.exports.configError);
      return res.status(500).json({ error: 'PayPal configuration error', debug: process.env.DEBUG_PAYPAL === 'true' ? module.exports.configError : undefined });
    }

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
    // Expose extra details when DEBUG_PAYPAL is true (safe toggle for troubleshooting)
    if ((process.env.NODE_ENV !== 'production' && err.details) || process.env.DEBUG_PAYPAL === 'true') {
      payload.details = err.details;
    }
    return res.status(500).json(payload);
  }
});

// Lightweight config endpoint to help debug environment variable presence
router.get('/config', (req, res) => {
  // Check configuration
  const clientIdPresent = !!(process.env.VITE_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID);
  const secretPresent = !!(process.env.VITE_PAYPAL_SECRET || process.env.PAYPAL_SECRET);
  const envPresent = !!process.env.NODE_ENV;
  const debugMode = process.env.DEBUG_PAYPAL === 'true';

  // Prepare response
  const config = {
    clientIdPresent,
    secretPresent,
    env: process.env.NODE_ENV || 'not set',
    debug: debugMode,
    ready: clientIdPresent && secretPresent
  };

  // Add error info in debug mode
  if (debugMode) {
    config.errors = [];
    if (!clientIdPresent) config.errors.push('Missing PAYPAL_CLIENT_ID');
    if (!secretPresent) config.errors.push('Missing PAYPAL_SECRET');
    if (!envPresent) config.errors.push('Missing NODE_ENV');
  }

  // In production, only show detailed info if DEBUG_PAYPAL is true
  if (process.env.NODE_ENV === 'production' && !debugMode) {
    return res.json({ ready: config.ready });
  }

  return res.json(config);
});

export default router;
