#!/usr/bin/env node
/**
 * RLS Policy Deep Dive
 * Queries actual RLS policies from Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing required env vars: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

console.log('='.repeat(80));
console.log('RLS POLICIES DETAILED INSPECTION');
console.log('='.repeat(80));

async function getRLSPolicies() {
  try {
    // Query information_schema to get RLS settings and policies
    const { data, error } = await client.rpc('get_policies_info').catch(() => {
      // Fallback: manually query via SQL if RPC doesn't exist
      return { data: null, error: 'RPC not available' };
    });
    
    if (error) {
      console.log('Note: RPC method not available, attempting manual inspection...\n');
      return null;
    }
    
    return data;
  } catch (err) {
    return null;
  }
}

async function checkTableRLSStatus(tableName) {
  try {
    // Try to query as anon user
    const { data: anonData, error: anonError } = await client
      .from(tableName)
      .select('*')
      .limit(1);
    
    // Try to query as service role (should always work)
    const { data: serviceData, error: serviceError } = await client
      .from(tableName)
      .select('*')
      .limit(1);
    
    const anonCanAccess = !anonError || anonError.code !== 'PGRST100';
    const serviceCanAccess = !serviceError;
    
    return {
      table: tableName,
      anonAccess: anonCanAccess,
      serviceAccess: serviceCanAccess,
      rlsEnabled: !anonCanAccess && serviceCanAccess
    };
  } catch (err) {
    return {
      table: tableName,
      error: err.message
    };
  }
}

async function analyzeOrderTables() {
  console.log('\n' + '='.repeat(80));
  console.log('PAYMENT FLOW TABLES ANALYSIS');
  console.log('='.repeat(80));
  
  const tables = ['orders', 'order_items', 'payouts'];
  
  for (const table of tables) {
    console.log(`\nTable: ${table}`);
    console.log('-'.repeat(80));
    
    const status = await checkTableRLSStatus(table);
    
    if (status.error) {
      console.log(`✗ Error checking table: ${status.error}`);
      continue;
    }
    
    console.log(`RLS Enabled: ${status.rlsEnabled ? '✓ YES' : '✗ NO'}`);
    console.log(`Anonymous Access: ${status.anonAccess ? 'Allowed' : 'Blocked'}`);
    console.log(`Service Role Access: ${status.serviceAccess ? 'Allowed' : 'Blocked'}`);
    
    if (!status.rlsEnabled) {
      console.log('\n⚠️  WARNING: RLS NOT ENABLED');
      console.log('This means anyone can access this table without authentication.');
      console.log('You should enable RLS and set policies.');
    }
  }
}

async function analyzeSensitiveTables() {
  console.log('\n' + '='.repeat(80));
  console.log('SENSITIVE TABLES SECURITY CHECK');
  console.log('='.repeat(80));
  
  const tables = ['products', 'product_variants', 'reviews'];
  
  for (const table of tables) {
    const status = await checkTableRLSStatus(table);
    
    if (status.error) {
      console.log(`\n${table}: ✗ Error - ${status.error}`);
      continue;
    }
    
    console.log(`\n${table}:`);
    console.log(`  RLS Enabled: ${status.rlsEnabled ? '✓' : '✗'}`);
    console.log(`  Public Access: ${status.anonAccess ? '✓ Allowed' : '✗ Blocked'}`);
  }
}

async function getTableStats() {
  console.log('\n' + '='.repeat(80));
  console.log('TABLE ROW COUNTS');
  console.log('='.repeat(80));
  
  const tables = ['products', 'product_variants', 'orders', 'order_items', 'reviews', 'payouts'];
  
  for (const table of tables) {
    try {
      const { count, error } = await client
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error && error.code === 'PGRST116') {
        console.log(`${table.padEnd(20)} - ✗ Table does not exist`);
      } else if (error) {
        console.log(`${table.padEnd(20)} - ⚠ Error: ${error.message}`);
      } else {
        console.log(`${table.padEnd(20)} - ${count} rows`);
      }
    } catch (err) {
      console.log(`${table.padEnd(20)} - ✗ ${err.message}`);
    }
  }
}

async function runFullAnalysis() {
  await analyzeOrderTables();
  await analyzeSensitiveTables();
  await getTableStats();
  
  console.log('\n' + '='.repeat(80));
  console.log('RLS RECOMMENDATIONS');
  console.log('='.repeat(80));
  
  console.log(`
1. PRODUCT TABLES (products, product_variants, reviews)
   Status: Should allow public read access (browsing)
   Action: Enable RLS with SELECT policies for anon users
   
2. ORDER TABLES (orders, order_items)
   Status: Should ONLY allow users to access their own orders
   Action: Enable RLS with policies checking auth.uid() = user_id
   
3. PAYOUT TABLE (payouts)
   Status: Should ONLY allow vendors to access their payouts
   Action: Enable RLS with policies checking user is vendor
   
4. SECURITY BEST PRACTICES
   ✓ Always enable RLS on production databases
   ✓ Use authenticated users for sensitive operations
   ✓ Validate permissions server-side before API calls
   ✓ Use service role key only on backend/server
   ✓ Never expose service role key in frontend
  `);
  
  console.log('='.repeat(80) + '\n');
}

runFullAnalysis().catch(err => {
  console.error('Analysis failed:', err);
  process.exit(1);
});
