#!/usr/bin/env node
/**
 * Detailed Column Inspection
 * Shows actual columns in each table
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectTable(tableName) {
  try {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log(`\n✗ ${tableName} - does not exist`);
      return;
    }
    
    if (error) {
      console.log(`\n⚠ ${tableName} - error: ${error.message}`);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log(`\n${tableName} - (empty table, attempting schema check)`);
      return;
    }
    
    const columns = Object.keys(data[0]);
    console.log(`\n${tableName}`);
    console.log('-'.repeat(60));
    console.log(`Columns (${columns.length}):`);
    columns.forEach(col => {
      const value = data[0][col];
      const type = typeof value;
      console.log(`  • ${col.padEnd(25)} : ${type}`);
    });
  } catch (err) {
    console.log(`\n✗ ${tableName} - ${err.message}`);
  }
}

async function run() {
  console.log('='.repeat(60));
  console.log('DATABASE TABLE COLUMN INSPECTION');
  console.log('='.repeat(60));
  
  const tables = [
    'products',
    'product_variants',
    'profiles',
    'orders',
    'order_items',
    'payouts',
    'reviews'
  ];
  
  for (const table of tables) {
    await inspectTable(table);
  }
  
  console.log('\n' + '='.repeat(60));
}

run().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
