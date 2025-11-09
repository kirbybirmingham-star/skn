import express from 'express';
import { createPayout } from './commission-payouts.js';
const router = express.Router();

// Create payout endpoint
router.post('/create-payout', express.json(), async (req, res) => {
  try {
    console.log('Received create-payout request');

    const { items } = req.body || {};

    // Debug request
    console.log('Payout Items:', JSON.stringify(items, null, 2));

    if (!Array.isArray(items) || items.length === 0) {
      console.error('Invalid payout items:', items);
      return res.status(400).send(JSON.stringify({ error: 'items required and must be a non-empty array' }));
    }

    // Defensive validation of items
    for (const item of items) {
      if (!item?.receiver || !item.amount) {
        console.error('Invalid item:', item);
        return res.status(400).send(JSON.stringify({ error: 'Each payout item must have a receiver and amount' }));
      }
    }

    const result = await createPayout(items);
    
    console.log('PayPal create-payout success, batch_id:', result.batch_header.payout_batch_id);
    return res.json(result);
  } catch (err) {
    console.error('Server create-payout error:', err && (err.stack || err));
    const payload = { error: err.message || 'Server error' };
    if ((process.env.NODE_ENV !== 'production' && err.details) || process.env.DEBUG_PAYPAL === 'true') {
      payload.details = err.details;
    }
    return res.status(500).json(payload);
  }
});

export default router;
