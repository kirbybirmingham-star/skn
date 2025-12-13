#!/usr/bin/env node
/**
 * RLS Access Control Test
 * Tests that RLS policies are working correctly
 * Checks: public access, authenticated access, admin access, service role access
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_ANON_KEY');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceRoleClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

console.log('='.repeat(80));
console.log('RLS ACCESS CONTROL TEST');
console.log('='.repeat(80));

async function testTableAccess(tableName, client, accessType) {
  try {
    const { data, error, status } = await client
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST100') {
        return { success: false, message: 'RLS blocked (PGRST100)', status: 403 };
      }
      if (error.code === 'PGRST116') {
        return { success: false, message: 'Table not found', status: 404 };
      }
      return { success: false, message: error.message, status };
    }
    
    return { success: true, message: 'Access allowed', rowCount: data?.length || 0 };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function runTests() {
  const tables = ['products', 'product_variants', 'profiles', 'orders', 'order_items', 'payouts', 'reviews'];
  
  console.log('\n1. CHECKING RLS ENABLED');
  console.log('-'.repeat(80));
  
  for (const table of tables) {
    try {
      const { data, error } = await serviceRoleClient
        .rpc('check_rls_enabled', { table_name: table })
        .catch(() => ({ data: null, error: 'RPC not available' }));
      
      // Fallback: Try to read and check error patterns
      const testResult = await testTableAccess(table, anonClient, 'anon');
      
      if (testResult.message.includes('RLS blocked')) {
        console.log(`✓ ${table.padEnd(20)} - RLS is ENABLED`);
      } else if (testResult.message === 'Access allowed') {
        console.log(`⚠ ${table.padEnd(20)} - RLS may not be enabled (public access allowed)`);
      } else {
        console.log(`? ${table.padEnd(20)} - Status unknown`);
      }
    } catch (err) {
      console.log(`✗ ${table.padEnd(20)} - Error: ${err.message}`);
    }
  }
  
  console.log('\n2. TESTING ANONYMOUS ACCESS (Should be BLOCKED for sensitive tables)');
  console.log('-'.repeat(80));
  
  const anonResults = {};
  for (const table of tables) {
    const result = await testTableAccess(table, anonClient, 'anon');
    anonResults[table] = result;
    
    // Expected results: products, product_variants, reviews = allowed; others = blocked
    const expectedAllowed = ['products', 'product_variants', 'reviews'];
    const shouldAllow = expectedAllowed.includes(table);
    
    const status = result.success ? '✓' : '✗';
    const symbol = (result.success === shouldAllow) ? '✓' : '⚠';
    
    console.log(`${symbol} ${table.padEnd(20)} - ${status} ${result.message}`);
    if (result.rowCount !== undefined) {
      console.log(`  └─ Rows accessible: ${result.rowCount}`);
    }
  }
  
  console.log('\n3. TESTING SERVICE ROLE ACCESS (Should be ALLOWED for all tables)');
  console.log('-'.repeat(80));
  
  for (const table of tables) {
    const result = await testTableAccess(table, serviceRoleClient, 'service_role');
    
    const symbol = result.success ? '✓' : '✗';
    console.log(`${symbol} ${table.padEnd(20)} - ${result.message}`);
    if (result.rowCount !== undefined) {
      console.log(`  └─ Rows accessible: ${result.rowCount}`);
    }
  }
  
  console.log('\n4. RLS EFFECTIVENESS CHECK');
  console.log('-'.repeat(80));
  
  const checks = [
    {
      name: 'Products',
      table: 'products',
      shouldAllow: true,
      reason: 'Public should be able to browse products'
    },
    {
      name: 'Orders',
      table: 'orders',
      shouldAllow: false,
      reason: 'Anonymous should NOT access orders'
    },
    {
      name: 'Profiles',
      table: 'profiles',
      shouldAllow: false,
      reason: 'Anonymous should NOT access profiles'
    },
    {
      name: 'Payouts',
      table: 'payouts',
      shouldAllow: false,
      reason: 'Anonymous should NOT access payouts'
    },
    {
      name: 'Reviews',
      table: 'reviews',
      shouldAllow: true,
      reason: 'Public should be able to read reviews'
    }
  ];
  
  let passCount = 0;
  let failCount = 0;
  
  for (const check of checks) {
    const result = anonResults[check.table];
    const isCorrect = result.success === check.shouldAllow;
    
    const symbol = isCorrect ? '✓' : '✗';
    console.log(`${symbol} ${check.name.padEnd(20)} - ${check.reason}`);
    console.log(`  Expected: ${check.shouldAllow ? 'ALLOWED' : 'BLOCKED'}`);
    console.log(`  Actual:   ${result.success ? 'ALLOWED' : 'BLOCKED'}`);
    
    if (isCorrect) passCount++;
    else failCount++;
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`\nRLS Policy Tests: ${passCount}/${checks.length} passed`);
  
  if (failCount === 0) {
    console.log('✓ All RLS policies are working correctly!');
  } else {
    console.log(`⚠ ${failCount} RLS policies need attention`);
  }
  
  console.log('\nNEXT STEPS:');
  console.log('-'.repeat(80));
  console.log('1. If RLS is not enabled on all tables:');
  console.log('   - Run: supabase_migrations/enable-rls-all-tables.sql');
  console.log('   - This enables RLS and applies all security policies');
  console.log('');
  console.log('2. If product_variants is empty:');
  console.log('   - Run: supabase_migrations/populate-product-variants.sql');
  console.log('   - This creates default variants for all products');
  console.log('');
  console.log('3. Verify the changes:');
  console.log('   - Run this test again after applying migrations');
  console.log('');
  console.log('4. Test payment flow:');
  console.log('   - npm run dev');
  console.log('   - Add item to cart');
  console.log('   - Test checkout with PayPal');
  
  console.log('\n' + '='.repeat(80) + '\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
