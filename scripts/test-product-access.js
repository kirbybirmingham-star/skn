import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const serviceClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAccess() {
  console.log('=== Testing Product Access ===\n');

  // Test with anon key
  console.log('1. Testing with ANONYMOUS key (what frontend uses):');
  const { data: anonData, error: anonError } = await anonClient
    .from('products')
    .select('id, title')
    .limit(1);
  
  if (anonError) {
    console.log(`   ✗ ERROR: ${anonError.message}`);
    console.log(`   ✗ Code: ${anonError.code}`);
  } else {
    console.log(`   ✓ SUCCESS: Got ${anonData.length} products`);
  }

  // Test with service role
  console.log('\n2. Testing with SERVICE_ROLE key (backend only):');
  const { data: serviceData, error: serviceError } = await serviceClient
    .from('products')
    .select('id, title')
    .limit(1);
  
  if (serviceError) {
    console.log(`   ✗ ERROR: ${serviceError.message}`);
  } else {
    console.log(`   ✓ SUCCESS: Got ${serviceData.length} products`);
  }

  console.log('\n=== DIAGNOSIS ===');
  if ((anonData?.length === 0 || anonError) && serviceData?.length > 0) {
    console.log('\n🔴 PROBLEM IDENTIFIED:');
    console.log('   The products table has RLS policies that block anonymous/public access.');
    console.log('   Service role can access, but frontend users cannot.\n');
    console.log('✅ SOLUTION:');
    console.log('   You need to add RLS policies allowing public READ access to products.\n');
    console.log('📝 STEPS:');
    console.log('   1. Open Supabase Dashboard: https://app.supabase.com/');
    console.log('   2. Go to Authentication > Policies');
    console.log('   3. Find the "products" table');
    console.log('   4. Add a NEW policy:');
    console.log('      - Name: "Allow public read"');
    console.log('      - Target Roles: public, anon');
    console.log('      - Permissions: SELECT');
    console.log('      - Using expression: is_published = true OR true (allow all)');
    console.log('\n   Or use the SQL in: scripts/fix-product-rls.sql\n');
  } else if (anonData?.length > 0 && serviceData?.length > 0) {
    console.log('\n✅ All good! Products are accessible to both anon and service role.');
  } else {
    console.log('\n⚠️  Unexpected state. Check your Supabase configuration.\n');
  }
}

testAccess().catch(console.error);
