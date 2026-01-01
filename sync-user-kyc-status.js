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

console.log('\n🔄 Syncing User KYC Status from Vendor Onboarding Status...\n');

// Status priority mapping and conversion to kyc_status enum values
// kyc_status enum only supports: not_started, approved
// Map vendor onboarding_status to user kyc_status
const mapStatusToKycStatus = (status) => {
  if (status === 'approved') return 'approved';
  if (['kyc_in_progress', 'pending', 'started'].includes(status)) return 'approved'; // Treat any progress as approved
  return 'not_started';
};

// Status priority for determining which vendor status to use
const statusPriority = {
  'not_started': 0,
  'started': 1,
  'pending': 2,
  'kyc_in_progress': 3,
  'approved': 4
};

try {
  // Get all users
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('created_at', { ascending: false });

  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('No users found');
    process.exit(0);
  }

  console.log(`Found ${users.length} users to process:\n`);

  let updateCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    // Get vendors for this user
    const { data: vendors } = await supabase
      .from('vendors')
      .select('onboarding_status')
      .eq('owner_id', user.id);

    if (!vendors || vendors.length === 0) {
      console.log(`⏭️  ${user.full_name}: No vendors found, skipping`);
      skippedCount++;
      continue;
    }

    // Find highest priority status (excluding not_started)
    const validStatuses = vendors
      .map(v => v.onboarding_status)
      .filter(status => status !== 'not_started')
      .filter((status, index, arr) => arr.indexOf(status) === index); // Remove duplicates

    if (validStatuses.length === 0) {
      console.log(`⏭️  ${user.full_name}: Only has "not_started" vendors, skipping`);
      skippedCount++;
      continue;
    }

    // Get the highest priority status
    const highestStatus = validStatuses.sort((a, b) => {
      return (statusPriority[b] || 0) - (statusPriority[a] || 0);
    })[0];

    // Convert vendor status to kyc_status enum value
    const kycStatus = mapStatusToKycStatus(highestStatus);

    console.log(`✏️  ${user.full_name}: Setting kyc_status to "${kycStatus}" (vendor status: "${highestStatus}")`);

    // Update user's kyc_status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ kyc_status: kycStatus })
      .eq('id', user.id);

    if (updateError) {
      console.error(`   ❌ Error updating: ${updateError.message}`);
    } else {
      updateCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Updated: ${updateCount} users`);
  console.log(`   ⏭️  Skipped: ${skippedCount} users`);
  console.log(`\n✅ Sync complete!\n`);

} catch (err) {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
}
