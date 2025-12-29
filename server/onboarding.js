import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { SUPABASE_CONFIG, SERVER_CONFIG } from './config.js';
import { verifySupabaseJwt } from './middleware/supabaseAuth.js';

// Note: dotenv.config() already called in server/index.js before importing routes

const router = express.Router();

// Lazy initialize Supabase on first request
let supabase = null;

function getSupabase() {
  if (supabase) return supabase;
  
  // Read directly from process.env to ensure we get the loaded values
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase not configured - missing URL or service role key');
    return null;
  }
  
  supabase = createClient(supabaseUrl, supabaseKey);
  return supabase;
}

// POST /api/onboarding/signup
// Body: { owner_id, name, slug, description, website, contact_email }
router.post('/signup', async (req, res) => {
  try {
    const supabase = getSupabase();
    console.log('POST /signup called with body:', req.body);
    if (!supabase) return res.status(503).json({ error: 'Server not configured for onboarding' });
    const { owner_id, name, slug, description, website, contact_email } = req.body;
    console.log('Extracted params - owner_id:', owner_id, 'name:', name, 'slug:', slug);
    if (!owner_id || !name || !slug) return res.status(400).json({ error: 'owner_id, name and slug are required' });

    // Create vendor row with onboarding status
    const onboardingToken = uuidv4();

    console.log('Attempting to insert vendor:', { owner_id, name, slug });
    const { data, error } = await supabase
      .from('vendors')
      .insert({
        owner_id,
        name,
        slug,
        description: description || null,
        website: website || null,
        metadata: { contact_email: contact_email || null },
        onboarding_status: 'started',
        onboarding_token: onboardingToken
      })
      .select();

    if (error) {
      console.error('Error creating vendor during onboarding signup:', JSON.stringify(error, null, 2));
      return res.status(500).json({ 
        error: error.message || 'Failed to create vendor', 
        code: error.code,
        hint: error.hint,
        details: error.details 
      });
    }

    console.log('Vendor created successfully:', data);
    const vendor = data && data[0];

    // Update user's profile to mark them as a vendor/seller
    if (owner_id && vendor) {
      console.log('Updating profile role to vendor for owner_id:', owner_id);
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'vendor' })
        .eq('id', owner_id);
      
      if (profileError) {
        console.warn('Warning: Could not update profile role to vendor:', profileError);
        // Don't fail the request, but log the warning
      } else {
        console.log('Successfully set profile role to vendor');
      }
    }

    // Build next steps response — in future this would integrate with a KYC provider
    const frontendUrl = SERVER_CONFIG.frontend.urls[0] || 'http://localhost:3000';
    const onboardingUrl = `${frontendUrl}/onboarding/${onboardingToken}`;

    return res.json({ vendor, onboardingUrl });
  } catch (err) {
    console.error('Onboarding signup error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/onboarding/me - return vendor for the authenticated user and some helper counts
// Also returns in-progress onboarding data for users in the middle of the onboarding flow
router.get('/me', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('[onboarding] GET /me: Supabase not configured, returning null vendor');
      return res.json({ vendor: null, onboarding: null, counts: { activeListings: 0, itemsSold: 0, itemsBought: 0 } });
    }

    // Verify JWT token inline
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.json({ vendor: null, onboarding: null, counts: { activeListings: 0, itemsSold: 0, itemsBought: 0 } });
    }
    
    const token = auth.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.json({ vendor: null, onboarding: null, counts: { activeListings: 0, itemsSold: 0, itemsBought: 0 } });
    }
    
    const requesterId = data.user.id;
    console.info('[onboarding] GET /me called; requesterId:', requesterId);

    // Find vendor owned by this user (includes both active and in-progress vendors)
    const { data: vendors, error: vErr } = await supabase
      .from('vendors')
      .select('*')
      .eq('owner_id', requesterId)
      .limit(1);
    
    if (vErr) return res.status(500).json({ error: 'DB error' });
    const vendor = vendors && vendors[0];
    
    if (!vendor) {
      return res.json({ vendor: null, onboarding: null, counts: { activeListings: 0, itemsSold: 0, itemsBought: 0 } });
    }

    // Include onboarding status in response
    const onboarding = {
      status: vendor.onboarding_status,
      token: vendor.onboarding_token,
      completedAt: vendor.onboarding_completed_at
    };


    // Active listings: published products for this vendor
    const { count: listingsCount, error: pErr } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('vendor_id', vendor.id).eq('is_published', true);
    if (pErr) console.warn('Failed to count products for vendor:', pErr);

    // Items sold: sum of quantities from order_items for this vendor where order status indicates paid/fulfilled/processing
    const paidStatuses = ['paid', 'processing', 'fulfilled'];
    const { data: soldRows, error: soldErr } = await supabase
      .from('order_items')
      .select('quantity, order_id')
      .eq('vendor_id', vendor.id);
    let itemsSold = 0;
    if (!soldErr && Array.isArray(soldRows)) {
      // need to check order status for each unique order_id
      const orderIds = [...new Set(soldRows.map(r => r.order_id))].filter(Boolean);
      if (orderIds.length > 0) {
        const { data: orders, error: oErr } = await supabase.from('orders').select('id, status').in('id', orderIds);
        const statusMap = {};
        if (!oErr && Array.isArray(orders)) orders.forEach(o => statusMap[o.id] = o.status);
        soldRows.forEach(r => {
          const status = statusMap[r.order_id];
          if (status && paidStatuses.includes(status)) itemsSold += Number(r.quantity || 0);
        });
      }
    }

    // Items bought: count of order_items where the current user is the buyer
    let itemsBought = 0;
    try {
      const { data: userOrders } = await supabase.from('orders').select('id').eq('user_id', requesterId).in('status', paidStatuses);
      const userOrderIds = (userOrders || []).map(o => o.id);
      if (userOrderIds.length > 0) {
        const { data: boughtRows } = await supabase.from('order_items').select('quantity').in('order_id', userOrderIds);
        (boughtRows || []).forEach(r => itemsBought += Number(r.quantity || 0));
      }
    } catch (err) {
      console.warn('Failed to compute itemsBought:', err);
    }

    return res.json({ vendor, onboarding, counts: { activeListings: listingsCount || 0, itemsSold, itemsBought } });
  } catch (err) {
    console.error('onboarding /me error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/onboarding/:token - retrieve vendor by onboarding token
router.get('/:token', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(503).json({ error: 'Server not configured for onboarding' });
    const token = req.params.token;
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('onboarding_token', token)
      .limit(1);
    if (error) return res.status(500).json({ error: 'DB error' });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ vendor: data[0] });
  } catch (err) {
    console.error('Onboarding GET error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/onboarding/start-kyc - body: { vendor_id }
// This starts a KYC session with the configured provider (stubbed) and returns a providerUrl
router.post('/start-kyc', verifySupabaseJwt, async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(503).json({ error: 'Server not configured for onboarding' });
    const { vendor_id } = req.body;
    if (!vendor_id) return res.status(400).json({ error: 'vendor_id required' });

    // Fetch vendor
    const { data: vendors, error: fetchErr } = await supabase.from('vendors').select('*').eq('id', vendor_id).limit(1);
    if (fetchErr) return res.status(500).json({ error: 'DB error' });
    const vendor = vendors && vendors[0];
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    // Authorization: only vendor owner can start KYC
    const requesterId = req.user?.id;
    if (!requesterId || requesterId !== vendor.owner_id) {
      return res.status(403).json({ error: 'Only the vendor owner may start KYC' });
    }

    // Here you'd call the real KYC provider SDK/API (e.g. jewelhuq) to create a session.
    // For now we'll create a stub provider session id and return a frontend URL to continue.
    const providerSessionId = `stub-${Date.now()}`;

    // Update vendor with kyc_provider and provisional kyc_id and status
    const { error: updErr } = await supabase
      .from('vendors')
      .update({ kyc_provider: process.env.KYC_PROVIDER || 'stub', kyc_id: providerSessionId, onboarding_status: 'kyc_in_progress' })
      .eq('id', vendor_id);
    if (updErr) console.warn('Failed to update vendor with kyc session:', updErr);

    // Construct a provider URL - in real integration this would be returned by the provider
    const frontendUrl = SERVER_CONFIG.frontend.urls[0] || 'http://localhost:3000';
    const providerUrl = `${frontendUrl}/onboarding/${vendor.onboarding_token}?provider=stub&session=${providerSessionId}`;

    return res.json({ providerUrl, providerSessionId });
  } catch (err) {
    console.error('start-kyc error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/onboarding/webhook - provider webhooks should POST verification results here
router.post('/webhook', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(503).json({ error: 'Server not configured for onboarding' });
    const payload = req.body;
    // Expect { onboarding_token, vendor_id, kyc_id, status, details }
    const { onboarding_token, vendor_id, kyc_id, status, details } = payload;

    let filter;
    if (onboarding_token) filter = { onboarding_token };
    else if (vendor_id) filter = { id: vendor_id };
    else if (kyc_id) filter = { kyc_id };
    else return res.status(400).json({ error: 'Missing identifier' });

    // Build update
    const updates = { onboarding_status: status || 'kyc_completed', onboarding_data: details || {} };
    if (kyc_id) updates.kyc_id = kyc_id;

    // Apply update
    let query = supabase.from('vendors');
    if (filter.onboarding_token) query = query.update(updates).eq('onboarding_token', filter.onboarding_token);
    else if (filter.id) query = query.update(updates).eq('id', filter.id);
    else if (filter.kyc_id) query = query.update(updates).eq('kyc_id', filter.kyc_id);

    const { error: uerr } = await query;
    if (uerr) {
      console.error('Webhook update error:', uerr);
      return res.status(500).json({ error: 'DB update failed' });
    }

    // Acknowledge
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/onboarding/:id/appeal - vendor requests an appeal (must be owner)
router.post('/:id/appeal', verifySupabaseJwt, async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(503).json({ error: 'Server not configured for onboarding' });
    const vendorId = req.params.id;
    const { reason } = req.body;
    if (!vendorId) return res.status(400).json({ error: 'vendor id required' });

    // Fetch vendor
    const { data: vendors, error: fetchErr } = await supabase.from('vendors').select('*').eq('id', vendorId).limit(1);
    if (fetchErr) return res.status(500).json({ error: 'DB error' });
    const vendor = vendors && vendors[0];
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    // Authorization: only owner can request appeal
    const requesterId = req.user?.id;
    if (!requesterId || requesterId !== vendor.owner_id) {
      return res.status(403).json({ error: 'Only the vendor owner may request an appeal' });
    }

    const appeals = (vendor.onboarding_data && vendor.onboarding_data.appeals) || [];
    const appeal = { id: `appeal-${Date.now()}`, reason: reason || '', created_at: new Date().toISOString() };
    appeals.push(appeal);

    const updates = { onboarding_status: 'appeal_requested', onboarding_data: { ...(vendor.onboarding_data || {}), appeals } };
    const { error: upErr } = await supabase.from('vendors').update(updates).eq('id', vendorId);
    if (upErr) return res.status(500).json({ error: 'Failed to record appeal' });

    return res.json({ success: true, appeal });
  } catch (err) {
    console.error('appeal error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
