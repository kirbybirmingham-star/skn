## PayPal Checkout Integration - Implementation Guide

This document aligns our PayPal integration with the [official PayPal Standard Checkout Integration guide](https://developer.paypal.com/studio/checkout/standard/integrate).

### Architecture Overview

Following PayPal's recommended architecture:

```
[Client Browser]
    ↓ (1) User clicks PayPal button
[Frontend React App]
    ├─→ (2) createOrder() callback
    │   └─→ POST /api/paypal/create-order (Backend)
    ├─→ (3) onApprove() callback  
    │   └─→ POST /api/paypal/capture-order/{orderID} (Backend)
    └─→ (4) Redirect to success page
    
[Backend Node.js Server]
    ├─→ generateAccessToken() [OAuth 2.0 Client Credentials]
    ├─→ Call PayPal Orders API v2
    └─→ Return order ID or capture status
    
[PayPal APIs]
    ├─→ POST /v1/oauth2/token
    ├─→ POST /v2/checkout/orders
    └─→ POST /v2/checkout/orders/{orderID}/capture
```

### Key Security Principles

1. **Server-Side Secret Handling**: PayPal Client Secret is **never** exposed to the client
2. **OAuth 2.0 Client Credentials**: Backend uses credentials to get access token
3. **Order Validation**: Backend validates cart items and totals before sending to PayPal
4. **Secure Communication**: All backend↔PayPal communication uses HTTPS

### Frontend Implementation

**Component**: `src/components/PayPalCheckout.jsx`

```jsx
<PayPalButtons
  createOrder={async (data, actions) => {
    // Step 1: Call backend to create order
    // Backend handles all PayPal API communication securely
    const orderID = await createPayPalOrder(cartItems);
    return orderID;
  }}
  onApprove={async (data) => {
    // Step 2: Call backend to capture payment
    // Backend confirms the payment with PayPal
    const orderData = await capturePayPalOrder(data.orderID);
    return orderData;
  }}
  onError={(err) => {
    // Handle errors gracefully
    toast({ variant: 'destructive', title: 'Payment Error', description: err.message });
  }}
/>
```

**API Functions**: `src/api/EcommerceApi.jsx`

```javascript
export async function createPayPalOrder(cartItems) {
  // 1. Validate cart
  // 2. Call backend: POST /api/paypal/create-order
  // 3. Return PayPal order ID to display buttons
}

export async function capturePayPalOrder(orderID) {
  // 1. Call backend: POST /api/paypal/capture-order/{orderID}
  // 2. Process payment confirmation
  // 3. Return order data
}
```

### Backend Implementation

**Environment Variables** (required in `.env`):
```bash
VITE_PAYPAL_CLIENT_ID=YOUR_SANDBOX_CLIENT_ID
VITE_PAYPAL_SECRET=YOUR_SANDBOX_CLIENT_SECRET
# Optional: VITE_NODE_ENV=sandbox|production
```

**API Routes**: `server/paypal-orders.js` and `server/paypal-capture.js`

#### Create Order Endpoint
```
POST /api/paypal/create-order

Request:
{
  "cartItems": [
    {
      "product": { "id": "...", "title": "..." },
      "variant": { "id": "...", "price_in_cents": 9999, "title": "..." },
      "quantity": 1
    }
  ]
}

Response:
{
  "id": "7YZ89ABC123",
  "status": "CREATED",
  "links": [...]
}
```

Steps:
1. Generate OAuth token using Client Credentials
2. Validate cart items and calculate total
3. Build PayPal order payload
4. Call: `POST /v2/checkout/orders`
5. Return order ID to frontend

#### Capture Payment Endpoint
```
POST /api/paypal/capture-order/{orderID}

Response:
{
  "id": "7YZ89ABC123",
  "status": "COMPLETED",
  "purchase_units": [...],
  "payer": {...}
}
```

Steps:
1. Generate OAuth token
2. Call: `POST /v2/checkout/orders/{orderID}/capture`
3. Update order status in database
4. Return transaction details to frontend

### Payment Flow Sequence

1. **User adds items to cart** → Stored in localStorage
2. **User clicks PayPal button** → Component displays
3. **User clicks "Pay Now"** → `createOrder()` called
4. **Frontend calls `/api/paypal/create-order`** → Backend creates PayPal order
5. **PayPal Checkout popup opens** → User reviews & approves
6. **Frontend calls `/api/paypal/capture-order/{orderID}`** → Backend captures payment
7. **Success page displays** → Cart clears
8. **Webhook updates order status** (async)

### Error Handling

**Client-Side** (PayPalCheckout.jsx):
- Display user-friendly error messages
- Show retry button for transient errors
- Log detailed errors to console for debugging

**Backend** (paypal-orders.js):
- Validate all inputs
- Catch and log API errors from PayPal
- Return descriptive error messages to client
- Handle auth token failures

**PayPal Errors**:
- `INSTRUMENT_DECLINED`: User's funding source failed → Let user select different method
- `AMOUNT_MISMATCH`: Order total doesn't match → Recalculate and retry
- `AUTHENTICATION_FAILURE`: Credentials invalid → Check `.env` configuration

### Configuration for Production

**Step 1**: Get Live Credentials
- Log into PayPal Developer Dashboard
- Navigate to Apps & Credentials → Live
- Copy Client ID and Secret

**Step 2**: Update Environment
```bash
VITE_PAYPAL_CLIENT_ID=your_live_client_id
VITE_PAYPAL_SECRET=your_live_client_secret
NODE_ENV=production
```

**Step 3**: Server auto-switches to production
- When `NODE_ENV=production`, backend uses:
  - `https://api-m.paypal.com` (instead of sandbox)
  - Live credentials from `.env`

### Testing Checklist

**Sandbox Testing** (use sandbox credentials):

- [ ] Cart displays items correctly
- [ ] Add to cart increases quantity
- [ ] Remove from cart works
- [ ] Total calculates correctly
- [ ] PayPal button appears
- [ ] Click button opens PayPal checkout
- [ ] Approve payment with sandbox buyer account
- [ ] Success page displays
- [ ] Cart clears after successful payment
- [ ] Log in to sandbox seller account and confirm funds received

**Error Scenarios**:
- [ ] Empty cart shows error
- [ ] Invalid items handled gracefully
- [ ] Network timeout shows retry button
- [ ] Cancelled payment redirects to cart
- [ ] Payment declined shows error message

### File Structure

```
src/
├── components/
│   └── PayPalCheckout.jsx          # React component with PayPal buttons
├── api/
│   └── EcommerceApi.jsx            # API functions (call backend)
└── hooks/
    └── useCart.jsx                 # Cart state management

server/
├── paypal-orders.js                # POST /api/paypal/create-order
├── paypal-capture.js               # POST /api/paypal/capture-order/:orderID
├── paypal-middleware.js            # CORS and auth middleware
└── index.js                        # Main server, mounts routes
```

### Related Documentation

- [PayPal Orders API v2](https://developer.paypal.com/docs/api/orders/v2/)
- [OAuth 2.0 Client Credentials](https://developer.paypal.com/docs/api/reference/get-an-access-token/)
- [JavaScript SDK Reference](https://developer.paypal.com/sdk/js/reference/#buttons)
- [Sandbox Card Testing](https://developer.paypal.com/tools/sandbox/card-testing/)

### Troubleshooting

**"PayPal Client ID is missing"**
- Set `VITE_PAYPAL_CLIENT_ID` in `.env`
- Run `npm run dev` (Vite will hot-reload)

**"Failed to obtain PayPal access token"**
- Verify `VITE_PAYPAL_SECRET` is correct in `.env`
- Check that server is running on port 3001
- Look at server console for detailed PayPal error

**"Order ID is undefined"**
- Backend `/api/paypal/create-order` not returning `id` field
- Check server console logs for PayPal API error

**"Cart items not displayed"**
- Verify items have `variant` object with `price_in_cents`
- Check browser localStorage for old data
- Clear browser cache/storage and reload

### Next Steps

1. ✅ Cart and checkout working
2. ✅ PayPal integration following official guide
3. ⏭️ **Database integration**: Store orders in Supabase
4. ⏭️ **Inventory management**: Decrement stock on capture
5. ⏭️ **Email confirmations**: Send receipt to buyer
6. ⏭️ **Order history**: Display in user dashboard
7. ⏭️ **Refunds**: Handle refund requests

### Support

For PayPal API issues:
- Check [PayPal Developer Forum](https://developer.paypal.com/forums/)
- Use [PayPal API Signature Tool](https://developer.paypal.com/tools/api-signature-tool/)

For application issues:
- Check server logs: `npm run dev`
- Check browser console: DevTools → Console
- Check network tab: DevTools → Network → XHR
