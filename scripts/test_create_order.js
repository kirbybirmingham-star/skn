import fetch from 'node-fetch';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

async function testCreateOrder() {
  const url = 'http://localhost:3001/api/paypal/create-order';
  const cartItems = [
    {
      product: { title: 'Test Product' },
      variant: { id: 'v1', price_in_cents: 1000, sale_price_in_cents: null },
      quantity: 1
    }
  ];

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Request failed:', err);
  }
}

testCreateOrder();
