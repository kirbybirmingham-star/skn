import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createVendorStore(email, storeName, description) {
  try {
    // Find user profile by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error('User profile not found:', profileError);
      return;
    }

    // Check if vendor already exists
    const { data: existingVendor, error: vendorCheckError } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', profile.id)
      .single();

    if (existingVendor) {
      console.log(`Vendor store already exists for ${email}`);
      return;
    }

    // Create vendor store
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        owner_id: profile.id,
        name: storeName,
        description: description,
        onboarding_status: 'completed',
        is_active: true
      })
      .select()
      .single();

    if (vendorError) {
      console.error('Failed to create vendor store:', vendorError);
      return;
    }

    console.log(`Successfully created vendor store "${storeName}" for ${email}`);
    console.log('Vendor ID:', vendor.id);

  } catch (err) {
    console.error('Error:', err);
  }
}

// Get command line arguments
const [,, email, storeName, description] = process.argv;

if (!email || !storeName || !description) {
  console.log('Usage: node create-vendor-store.js <email> <storeName> <description>');
  console.log('Example: node create-vendor-store.js user@example.com "My Store" "Store description"');
  process.exit(1);
}

createVendorStore(email, storeName, description);