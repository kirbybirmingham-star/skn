import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Get all vendors
  const { data: vendors, error } = await client
    .from('vendors')
    .select('id, owner_id, name, onboarding_status')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  console.log('All Vendors:\n');
  vendors.forEach((v, idx) => {
    console.log(`${idx + 1}. ${v.name}`);
    console.log(`   ID: ${v.id}`);
    console.log(`   Owner: ${v.owner_id}`);
    console.log(`   Status: ${v.onboarding_status}\n`);
  });
  
  process.exit(0);
})();
