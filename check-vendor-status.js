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

console.log('\n📋 Checking Vendor Statuses...\n');

try {
  // Get all vendors with their owner info
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id, owner_id, name, onboarding_status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching vendors:', error.message);
    process.exit(1);
  }

  if (!vendors || vendors.length === 0) {
    console.log('No vendors found in database');
    process.exit(0);
  }

  console.log(`Found ${vendors.length} vendors:\n`);
  
  vendors.forEach((vendor, index) => {
    console.log(`${index + 1}. ${vendor.name}`);
    console.log(`   ID: ${vendor.id}`);
    console.log(`   Owner ID: ${vendor.owner_id || 'NOT SET'}`);
    console.log(`   Onboarding Status: ${vendor.onboarding_status}`);
    console.log(`   Created: ${new Date(vendor.created_at).toLocaleDateString()}`);
    console.log();
  });

  // Check for vendors with products
  const { data: vendorsWithProducts, error: productsError } = await supabase
    .from('vendors')
    .select('id, name, onboarding_status, products(count)');

  if (!productsError && vendorsWithProducts) {
    console.log('📦 Vendors with Product Counts:\n');
    vendorsWithProducts.forEach(vendor => {
      const productCount = vendor.products?.[0]?.count || 0;
      console.log(`${vendor.name}: ${productCount} products (Status: ${vendor.onboarding_status})`);
    });
  }

} catch (err) {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
}

console.log('\n✅ Done\n');
