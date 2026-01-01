import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase not configured for onboarding route. Onboarding endpoints will be disabled.');
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const router = express.Router();

// POST /api/onboarding/signup
// Body: { owner_id, name, slug, description, website, contact_email }
router.post('/signup', async (req, res) => {
  try {
    console.log('POST /signup called with body:', req.body);
    if (!supabase) return res.status(503).json({ error: 'Server not configured for onboarding' });
    const { owner_id, name, slug, description, website, contact_email } = req.body;
    console.log('Extracted params - owner_id:', owner_id, 'name:', name, 'slug:', slug);
    if (!owner_id || !name || !slug) return res.status(400).json({ error: 'owner_id, name and slug are required' });

    // Create vendor row with onboarding status
    const onboardingToken = uuidv4();

    console.log('Attempting to insert vendor:', { owner_id, name, slug });

    // If this owner already has a vendor, return it (idempotent for repeat submissions)
    try {
      const { data: existingOwnerVendor, error: ownerErr } = await supabase
        .from('vendors')
        .select('*')
        .eq('owner_id', owner_id)
        .limit(1);
      if (ownerErr) console.warn('Owner vendor lookup failed:', ownerErr);
      if (Array.isArray(existingOwnerVendor) && existingOwnerVendor.length > 0) {
        const existingVendor = existingOwnerVendor[0];
        // Ensure profile role is set to vendor to avoid RequireRole blocking
        try {
          const { error: updateErr } = await supabase.from('profiles').update({ role: 'vendor' }).eq('id', owner_id);
          if (updateErr) console.warn('Could not update profile role for existing vendor:', updateErr);
          else console.log('Updated profile role to vendor for existing owner');
        } catch (uErr) {
          console.warn('Error updating profile role for existing vendor:', uErr);
        }

        const onboardingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding/${existingVendor.onboarding_token}`;
        return res.json({ vendor: existingVendor, onboardingUrl, existing: true });
      }
    } catch (chkErr) {
      console.warn('Unexpected error checking existing vendor by owner:', chkErr);
    }

    // Check for existing slug. If it's owned by someone else, return 409. If owned by same owner, return that vendor.
    try {
      const { data: slugRows, error: slugErr } = await supabase.from('vendors').select('*').eq('slug', slug).limit(1);
      if (slugErr) console.warn('Slug lookup failed:', slugErr);
      if (Array.isArray(slugRows) && slugRows.length > 0) {
        const found = slugRows[0];
        if (found.owner_id && found.owner_id !== owner_id) {
          return res.status(409).json({ error: 'Slug already in use. Please choose a different slug.' });
        }
        // If the slug exists and belongs to this owner, return the existing vendor
        if (found.owner_id === owner_id) {
          const onboardingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding/${found.onboarding_token}`;
          return res.json({ vendor: found, onboardingUrl, existing: true });
        }
      }
    } catch (chkErr) {
      console.warn('Unexpected error checking slug uniqueness:', chkErr);
    }

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
      // Handle unique constraint violation on slug gracefully
      const msg = (error && (error.message || '') ) || '';
      const details = error && (error.details || '');
      if (msg.includes('duplicate key') || details.includes('vendors_slug_key') || (error.code && String(error.code).includes('23505'))) {
        return res.status(409).json({ error: 'Slug already in use. Please choose a different slug.' });
      }
      return res.status(500).json({ 
        error: error.message || 'Failed to create vendor', 
        code: error.code,
        hint: error.hint,
        details: error.details 
      });
    }

    console.log('Vendor created successfully:', data);
    const vendor = data && data[0];

    // Update user's profile role to 'vendor' so they can access vendor dashboard
    if (vendor && owner_id) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'vendor' })
        .eq('id', owner_id);
      
      if (updateError) {
        console.error('Warning: Could not update profile role to vendor:', updateError);
        // Don't fail the whole request if role update fails, just log it
      } else {
        console.log('Successfully updated user profile role to vendor');
      }
    }

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
import { verifySupabaseJwt } from './middleware/supabaseAuth.js';

router.post('/start-kyc', verifySupabaseJwt, async (req, res) => {
  try {
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
    const providerUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding/${vendor.onboarding_token}?provider=stub&session=${providerSessionId}`;

    return res.json({ providerUrl, providerSessionId });
  } catch (err) {
    console.error('start-kyc error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/onboarding/me - return vendor for the authenticated user and some helper counts
router.get('/me', verifySupabaseJwt, async (req, res) => {
  try {
    const requesterId = req.user?.id;
    if (!requesterId) return res.status(401).json({ error: 'Not authenticated' });

    // Find vendor owned by this user
    const { data: vendors, error: vErr } = await supabase.from('vendors').select('*').eq('owner_id', requesterId).limit(1);
    if (vErr) return res.status(500).json({ error: 'DB error' });
    const vendor = vendors && vendors[0];
    if (!vendor) return res.json({ vendor: null, counts: { activeListings: 0, itemsSold: 0, itemsBought: 0 } });

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

    return res.json({ vendor, counts: { activeListings: listingsCount || 0, itemsSold, itemsBought } });
  } catch (err) {
    console.error('onboarding /me error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/onboarding/webhook - provider webhooks should POST verification results here
router.post('/webhook', async (req, res) => {
  try {
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

// POST /api/onboarding/:id/complete - mark onboarding completed (dev/test helper)
router.post('/:id/complete', async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Server not configured for onboarding' });
    const vendorId = req.params.id;
    if (!vendorId) return res.status(400).json({ error: 'vendor id required' });

    // Fetch vendor to get owner id
    const { data: vendors, error: fetchErr } = await supabase.from('vendors').select('*').eq('id', vendorId).limit(1);
    if (fetchErr) {
      console.error('Error fetching vendor for complete:', fetchErr);
      return res.status(500).json({ error: 'DB error' });
    }
    const vendor = vendors && vendors[0];
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    // Update vendor onboarding status to completed
    const { error: updErr } = await supabase.from('vendors').update({ onboarding_status: 'completed' }).eq('id', vendorId);
    if (updErr) console.warn('Could not update vendor onboarding_status:', updErr);

    // Update profile role to vendor for the owner
    if (vendor.owner_id) {
      const { error: roleErr } = await supabase.from('profiles').upsert({ id: vendor.owner_id, role: 'vendor' }, { onConflict: 'id' });
      if (roleErr) console.warn('Could not upsert profile role to vendor:', roleErr);
    }

    return res.json({ success: true, vendor_id: vendorId });
  } catch (err) {
    console.error('complete onboarding error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;

// --- Dev-only helpers: check and force-set profile role ---
// These endpoints are only enabled when not in production and use the service role key.
// POST /api/onboarding/dev/force-vendor { user_id }
// GET  /api/onboarding/dev/profile/:id
try {
  if (process.env.NODE_ENV !== 'production') {
    router.get('/dev/profile/:id', async (req, res) => {
      const id = req.params.id;
      if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
        if (error) return res.status(500).json({ error: error.message || 'DB error' });
        return res.json({ profile: data });
      } catch (err) {
        console.error('Dev profile fetch error:', err);
        return res.status(500).json({ error: 'Server error' });
      }
    });

    router.post('/dev/force-vendor', async (req, res) => {
      const { user_id } = req.body || {};
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
      try {
        // Upsert profile with role 'vendor'
        const profileRow = { id: user_id, role: 'vendor', updated_at: new Date().toISOString() };
        const { data, error } = await supabase.from('profiles').upsert(profileRow, { onConflict: 'id' }).select().maybeSingle();
        if (error) return res.status(500).json({ error: error.message || 'DB error' });
        return res.json({ success: true, profile: data });
      } catch (err) {
        console.error('Dev force-vendor error:', err);
        return res.status(500).json({ error: 'Server error' });
      }
    });

    router.post('/dev/force-admin', async (req, res) => {
      const { user_id, email } = req.body || {};
      if (!user_id || !email) return res.status(400).json({ error: 'user_id and email required' });
      if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
      try {
        // First ensure the user exists in profiles
        const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', user_id).maybeSingle();

        // Upsert profile with role 'admin'
        const profileRow = {
          id: user_id,
          email: email,
          role: 'admin',
          updated_at: new Date().toISOString()
        };

        // If profile exists, just update the role, otherwise create it
        if (existingProfile) {
          profileRow.full_name = existingProfile.full_name;
          profileRow.avatar_url = existingProfile.avatar_url;
        }

        const { data, error } = await supabase.from('profiles').upsert(profileRow, { onConflict: 'id' }).select().maybeSingle();
        if (error) return res.status(500).json({ error: error.message || 'DB error' });
        return res.json({ success: true, profile: data, message: 'Admin role set successfully' });
      } catch (err) {
        console.error('Dev force-admin error:', err);
        return res.status(500).json({ error: 'Server error' });
      }
    });
  }
} catch (err) {
  console.warn('Failed to register dev endpoints:', err);
}
