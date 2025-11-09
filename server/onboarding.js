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

export default router;
