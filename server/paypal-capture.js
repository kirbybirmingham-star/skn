import express from 'express';
import fetch from 'node-fetch';
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
    return res.send(JSON.stringify(data));
  } catch (err) {
    console.error('Server capture-order error:', err && (err.stack || err));
    const payload = { error: err.message || 'Server error' };
    if (process.env.NODE_ENV !== 'production' && err.details) payload.details = err.details;
    return res.status(500).send(JSON.stringify(payload));
  }
});

export default router;