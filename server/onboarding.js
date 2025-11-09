import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase not configured for onboarding route. Some operations will fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const router = express.Router();

// POST /api/onboarding/signup
// Body: { owner_id, name, slug, description, website, contact_email }
router.post('/signup', async (req, res) => {
  try {
    const { owner_id, name, slug, description, website, contact_email } = req.body;
    if (!owner_id || !name || !slug) return res.status(400).json({ error: 'owner_id, name and slug are required' });

    // Create vendor row with onboarding status
    const onboardingToken = uuidv4();

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
        onboarding_token: onboardingToken,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error creating vendor during onboarding signup:', error);
      return res.status(500).json({ error: 'Failed to create vendor' });
    }

    const vendor = data && data[0];

    // Build next steps response — in future this would integrate with a KYC provider
    const onboardingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding/${onboardingToken}`;

    return res.json({ vendor, onboardingUrl });
  } catch (err) {
    console.error('Onboarding signup error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/onboarding/:token - retrieve vendor by onboarding token
router.get('/:token', async (req, res) => {
  try {
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
import { verifySupabaseJwt } from './middleware/supabaseAuth.js';

router.post('/start-kyc', verifySupabaseJwt, async (req, res) => {
  try {
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
    const providerUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding/${vendor.onboarding_token}?provider=stub&session=${providerSessionId}`;

    return res.json({ providerUrl, providerSessionId });
  } catch (err) {
    console.error('start-kyc error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/onboarding/webhook - provider webhooks should POST verification results here
router.post('/webhook', async (req, res) => {
  try {
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
