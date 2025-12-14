import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifySupabaseJwt } from './middleware/supabaseAuth.js';

const router = express.Router();

// Lazy initialize Supabase on first request
let supabase = null;

function getSupabase() {
  if (supabase) return supabase;
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase not configured - missing URL or service role key');
    return null;
  }
  
  supabase = createClient(supabaseUrl, supabaseKey);
  return supabase;
}

// PUT /api/vendor/:vendorId - Update vendor information
router.put('/:vendorId', verifySupabaseJwt, async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(503).json({ error: 'Server not configured' });

    const { vendorId } = req.params;
    const { name, slug, description, website, contact_email } = req.body;
    const requesterId = req.user?.id;

    if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    // Fetch the vendor to verify ownership
    const { data: vendor, error: fetchError } = await supabase
      .from('vendors')
      .select('owner_id')
      .eq('id', vendorId)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (vendor.owner_id !== requesterId) {
      return res.status(403).json({ error: 'You are not authorized to edit this store' });
    }

    // Update the vendor
    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update({
        name,
        slug,
        description,
        website,
        metadata: { contact_email },
      })
      .eq('id', vendorId)
      .select();

    if (updateError) {
      return res.status(500).json({ error: updateError.message || 'Failed to update vendor' });
    }

    return res.json({ vendor: updatedVendor[0] });
  } catch (err) {
    console.error('Error updating vendor:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
