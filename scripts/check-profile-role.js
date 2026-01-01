import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProfiles() {
  console.log('\n=== Checking Profiles Table ===\n');

  // Get all profiles with admin key
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`Found ${data.length} profiles:`);
  console.log(JSON.stringify(data, null, 2));

  // Also check vendors table
  console.log('\n=== Checking Vendors Table ===\n');
  const { data: vendors, error: vendorError } = await supabaseAdmin
    .from('vendors')
    .select('*');

  if (vendorError) {
    console.error('Error fetching vendors:', vendorError);
    return;
  }

  console.log(`Found ${vendors.length} vendors:`);
  console.log(JSON.stringify(vendors, null, 2));
}

checkProfiles().catch(console.error);
