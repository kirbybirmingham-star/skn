import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env'), override: true });

// Import Supabase client
const { createClient } = await import('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('\n👤 Checking User & Vendor Mapping...\n');

try {
  // Get all users with their vendor info
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('created_at', { ascending: false })
    .limit(10);

  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message);
    process.exit(1);
  }

  console.log(`Found ${users?.length || 0} users:\n`);
  
  for (const user of (users || [])) {
    console.log(`User: ${user.full_name} (${user.id})`);
    
    // Get vendors for this user
    const { data: userVendors } = await supabase
      .from('vendors')
      .select('id, name, onboarding_status')
      .eq('owner_id', user.id);
    
    if (userVendors && userVendors.length > 0) {
      userVendors.forEach(v => {
        console.log(`   └─ ${v.name}: ${v.onboarding_status} (${v.id})`);
      });
    } else {
      console.log('   └─ No vendors');
    }
    console.log();
  }

} catch (err) {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
}

console.log('✅ Done\n');
