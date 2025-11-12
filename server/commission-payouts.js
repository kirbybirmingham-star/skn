import fetch from 'node-fetch';

const PAYPAL_API = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  production: 'https://api-m.paypal.com'
};

const NODE_ENV = (process.env.NODE_ENV || process.env.VITE_NODE_ENV || 'development').toLowerCase();
const ENV = NODE_ENV === 'production' || NODE_ENV === 'live' ? 'production' : 'sandbox';

const PAYPAL_CLIENT_ID = process.env.VITE_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.VITE_PAYPAL_SECRET || process.env.PAYPAL_SECRET;

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
      throw new Error(`Failed to obtain PayPal access token: ${data.error_description}`);
    }

    return data.access_token;
  } catch (err) {
    console.error('generateAccessToken error:', err);
    throw err;
  }
}

export async function createPayout(items) {
  try {
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API[ENV]}/v1/payments/payouts`;

    const payload = {
      sender_batch_header: {
        sender_batch_id: `Payouts_${Date.now()}`,
        email_subject: 'You have a payout!',
        email_message: 'You have received a payout! Thanks for using our service!'
      },
      items: items.map(item => ({
        recipient_type: 'EMAIL',
        amount: {
          value: item.amount,
          currency: 'USD'
        },
        note: 'Thanks for your business!',
        sender_item_id: `item_${Date.now()}`,
        receiver: item.receiver
      }))
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`PayPal create-payout failed: ${data.message}`);
    }

    return data;
  } catch (err) {
    console.error('createPayout error:', err);
    throw err;
  }
}
