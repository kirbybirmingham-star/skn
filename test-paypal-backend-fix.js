#!/usr/bin/env node
/**
 * Test PayPal create-order endpoint with proper cart structure
 */

const cartItems = [{
  product: {
    id: "test-prod",
    title: "Test Product",
    description: "A test product",
    base_price: 9999
  },
  variant: {
    id: "var-001",
    title: "Black",
    price_in_cents: 9999,
    sale_price_in_cents: null
  },
  quantity: 1
}];

console.log('Testing PayPal create-order endpoint...');
console.log('Cart structure:');
console.log(JSON.stringify(cartItems, null, 2));

fetch('http://localhost:3001/api/paypal/create-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cartItems })
})
  .then(res => {
    console.log(`\nResponse status: ${res.status}`);
    return res.json();
  })
  .then(data => {
    if (data.id) {
      console.log(`✓ Success! PayPal Order ID: ${data.id}`);
      console.log(`Order details: ${JSON.stringify(data, null, 2)}`);
    } else {
      console.error(`✗ Error: ${data.error || data.message || 'Unknown error'}`);
      console.log('Full response:', JSON.stringify(data, null, 2));
    }
    process.exit(data.id ? 0 : 1);
  })
  .catch(err => {
    console.error('✗ Request failed:', err.message);
    process.exit(1);
  });
