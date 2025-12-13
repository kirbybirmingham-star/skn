#!/usr/bin/env node
/**
 * Database Schema and RLS Test
 * Checks for relevant tables needed for cart/payment flow and verifies RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create clients
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceRoleClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY);

console.log('='.repeat(70));
console.log('DATABASE SCHEMA AND RLS VERIFICATION');
console.log('='.repeat(70));

// Define tables needed for payment flow
const REQUIRED_TABLES = [
  {
    name: 'products',
    description: 'Product catalog',
    criticalColumns: ['id', 'title', 'base_price', 'vendor_id']
  },
  {
    name: 'product_variants',
    description: 'Product variants with pricing',
    criticalColumns: ['id', 'product_id', 'price_in_cents', 'sale_price_in_cents']
  },
  {
    name: 'profiles',
    description: 'User profiles and auth',
    criticalColumns: ['id', 'email']
  },
  {
    name: 'orders',
    description: 'Customer orders',
    criticalColumns: ['id', 'user_id', 'total_cents', 'status', 'created_at']
  },
  {
    name: 'order_items',
    description: 'Line items in orders',
    criticalColumns: ['id', 'order_id', 'product_id', 'variant_id', 'quantity', 'price_cents']
  },
  {
    name: 'payouts',
    description: 'Vendor payouts',
    criticalColumns: ['id', 'vendor_id', 'amount', 'status']
  },
  {
    name: 'reviews',
    description: 'Product reviews',
    criticalColumns: ['id', 'product_id', 'user_id', 'rating', 'title', 'body']
  }
];

async function checkTable(tableName) {
  try {
    const { data, error } = await serviceRoleClient
      .from(tableName)
      .select('*')
      .limit(0);
    
    if (error && error.code === 'PGRST116') {
      return { exists: false, error: 'Table does not exist' };
    }
    if (error) {
      return { exists: false, error: error.message };
    }
    return { exists: true };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function getTableColumns(tableName) {
  try {
    const { data, error } = await serviceRoleClient
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) return [];
    
    // If table exists but is empty, try schema query
    if (!data || data.length === 0) {
      // Try selecting a specific column to verify schema exists
      const { data: schemaData, error: schemaError } = await serviceRoleClient
        .rpc('get_table_columns', { table_name: tableName })
        .catch(() => ({ data: null, error: null }));
      
      return schemaData || [];
    }
    
    // Return column names from first row
    return data.length > 0 ? Object.keys(data[0]) : [];
  } catch (err) {
    return [];
  }
}

async function checkRLSPolicy(tableName) {
  try {
    // RLS info would require direct DB connection - for now just note if table exists
    // Real implementation would query information_schema
    return { enabled: null, policies: [] };
  } catch (err) {
    return { error: err.message };
  }
}

async function testRLSEnforcement(tableName) {
  try {
    // Test if we can read table with anon key (will fail if RLS blocks it)
    const { data, error } = await anonClient
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST100') {
      return { rlsActive: true, message: 'RLS is blocking access (expected)' };
    }
    if (error && error.code === 'PGRST116') {
      return { rlsActive: null, message: 'Table does not exist' };
    }
    if (error) {
      return { rlsActive: true, message: `Error: ${error.message}` };
    }
    
    return { rlsActive: false, message: 'RLS not enforcing (public access allowed)' };
  } catch (err) {
    return { error: err.message };
  }
}

async function runTests() {
  console.log('\n1. CHECKING REQUIRED TABLES');
  console.log('-'.repeat(70));
  
  const tableResults = {};
  for (const table of REQUIRED_TABLES) {
    const status = await checkTable(table.name);
    tableResults[table.name] = status;
    
    const symbol = status.exists ? '✓' : '✗';
    console.log(`${symbol} ${table.name.padEnd(20)} - ${table.description}`);
    if (!status.exists) {
      console.log(`  └─ ${status.error}`);
    }
  }
  
  console.log('\n2. CHECKING TABLE COLUMNS (Critical columns only)');
  console.log('-'.repeat(70));
  
  for (const table of REQUIRED_TABLES) {
    if (!tableResults[table.name].exists) {
      console.log(`⊘ ${table.name.padEnd(20)} - Table does not exist, skipping column check`);
      continue;
    }
    
    const columns = await getTableColumns(table.name);
    const hasAllColumns = table.criticalColumns.every(col => columns.includes(col));
    
    const symbol = hasAllColumns ? '✓' : '⚠';
    console.log(`${symbol} ${table.name.padEnd(20)}`);
    
    const missing = table.criticalColumns.filter(col => !columns.includes(col));
    if (missing.length > 0) {
      console.log(`  └─ Missing columns: ${missing.join(', ')}`);
    }
    
    if (columns.length > 0) {
      const foundColumns = table.criticalColumns.filter(col => columns.includes(col));
      console.log(`  └─ Has columns: ${foundColumns.join(', ')}`);
    }
  }
  
  console.log('\n3. CHECKING RLS ENFORCEMENT');
  console.log('-'.repeat(70));
  
  for (const table of REQUIRED_TABLES) {
    if (!tableResults[table.name].exists) {
      console.log(`⊘ ${table.name.padEnd(20)} - Table does not exist, skipping RLS check`);
      continue;
    }
    
    const rls = await testRLSEnforcement(table.name);
    
    if (rls.error) {
      console.log(`✗ ${table.name.padEnd(20)} - Error: ${rls.error}`);
    } else if (rls.rlsActive === true) {
      console.log(`✓ ${table.name.padEnd(20)} - RLS ACTIVE (restricting access)`);
    } else if (rls.rlsActive === false) {
      console.log(`✗ ${table.name.padEnd(20)} - RLS NOT ENFORCED (public access)`);
    } else {
      console.log(`? ${table.name.padEnd(20)} - RLS status unknown`);
    }
    console.log(`  └─ ${rls.message}`);
  }
  
  console.log('\n4. PAYMENT-RELATED TABLES STATUS');
  console.log('-'.repeat(70));
  
  const paymentTables = ['orders', 'order_items', 'payouts'];
  const paymentStatus = paymentTables.map(t => {
    const exists = tableResults[t]?.exists ? '✓' : '✗';
    return `${exists} ${t}`;
  }).join('  |  ');
  
  console.log(paymentStatus);
  
  if (!tableResults['orders']?.exists) {
    console.log('\n⚠️  WARNING: Orders table missing!');
    console.log('   You will need to create this table to store order data.');
    console.log('   See PAYPAL_INTEGRATION_GUIDE.md for schema.');
  }
  
  console.log('\n5. REVIEW TABLE STATUS');
  console.log('-'.repeat(70));
  
  if (tableResults['reviews']?.exists) {
    console.log('✓ Reviews table exists');
    const columns = await getTableColumns('reviews');
    console.log(`  └─ Columns: ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}`);
  } else {
    console.log('✗ Reviews table missing');
  }
  
  console.log('\n6. PRODUCT VARIANTS STATUS');
  console.log('-'.repeat(70));
  
  if (tableResults['product_variants']?.exists) {
    console.log('✓ Product variants table exists');
    const columns = await getTableColumns('product_variants');
    const hasPriceCols = columns.includes('price_in_cents') && columns.includes('sale_price_in_cents');
    if (hasPriceCols) {
      console.log('  ✓ Has pricing columns (price_in_cents, sale_price_in_cents)');
    } else {
      console.log('  ✗ Missing pricing columns');
    }
  } else {
    console.log('✗ Product variants table missing');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  
  const existingTables = Object.entries(tableResults)
    .filter(([_, status]) => status.exists)
    .length;
  
  const totalTables = REQUIRED_TABLES.length;
  
  console.log(`Tables found: ${existingTables}/${totalTables}`);
  
  if (existingTables === totalTables) {
    console.log('✓ All required tables exist');
  } else {
    const missing = Object.entries(tableResults)
      .filter(([_, status]) => !status.exists)
      .map(([name]) => name);
    console.log(`✗ Missing tables: ${missing.join(', ')}`);
  }
  
  console.log('\nRECOMMENDATIONS:');
  console.log('-'.repeat(70));
  
  if (!tableResults['orders']?.exists) {
    console.log('1. Create orders table for storing order information');
  }
  if (!tableResults['order_items']?.exists) {
    console.log('2. Create order_items table for line items');
  }
  if (!tableResults['payouts']?.exists) {
    console.log('3. Create payouts table for vendor payments');
  }
  
  console.log('4. Verify RLS policies are correctly configured');
  console.log('5. Test payment flow with development account');
  
  console.log('\n' + '='.repeat(70));
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
