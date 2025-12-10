import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRLS() {
  console.log('Checking RLS policies on products table...\n');

  // Get the current RLS policies on products
  const { data: policies, error: policiesError } = await supabase
    .rpc('get_policies', { schema_name: 'public', table_name: 'products' })
    .catch(() => ({ data: null, error: null }));

  if (policiesError) {
    console.log('Could not fetch policies via RPC (might not exist), will add via SQL');
  } else if (policies) {
    console.log('Current policies:', policies);
  }

  // Since we're using service role, we can execute SQL directly to add policy
  console.log('\nAttempting to enable public read access to products...');
  
  // First, check if RLS is enabled
  const { data: rlsStatus } = await supabase.rpc('check_rls_status', {
    table_name: 'products'
  }).catch(() => ({ data: null }));

  console.log('RLS Status:', rlsStatus);

  // Try using the admin API endpoint to create a policy
  // For now, let's just document what needs to be done
  console.log('\n✓ To fix this, you need to enable public read access to products.');
  console.log('  Option 1 (Recommended): Add an RLS policy in Supabase Dashboard:');
  console.log('    - Table: products');
  console.log('    - Enable RLS if not already enabled');
  console.log('    - Add policy: Allow SELECT for all users (WHERE true)');
  console.log('\n  Option 2: Disable RLS on products table (less secure)');
}

fixRLS().catch(console.error);
