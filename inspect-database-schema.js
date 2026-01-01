/**
 * Database Schema Inspector
 * Reads and displays database structure for image management setup
 * 
 * Usage: node inspect-database-schema.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY environment variables required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Get table schema information
 */
async function getTableSchema(tableName) {
  console.log(`\n📋 Inspecting table: ${tableName}\n`);

  try {
    // Get table information from information_schema
    const { data, error } = await supabase.rpc('get_table_schema', {
      table_name: tableName
    }).catch(() => {
      // Fallback: query directly using SQL
      return { data: null, error: 'RPC not available' };
    });

    if (error || !data) {
      // Fallback: try to get schema by selecting and checking columns
      const { data: sample, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log(`❌ Table not accessible: ${sampleError.message}`);
        return null;
      }

      if (sample && sample.length > 0) {
        const record = sample[0];
        console.log(`✅ Table "${tableName}" exists`);
        console.log(`\nColumns found:`);
        
        Object.keys(record).forEach((col, idx) => {
          const value = record[col];
          const type = typeof value;
          console.log(`  ${idx + 1}. ${col}: ${value === null ? 'NULL' : type}`);
        });

        return {
          table: tableName,
          columns: Object.keys(record)
        };
      } else {
        console.log(`ℹ️  Table "${tableName}" exists but is empty`);
        return null;
      }
    }

    return data;
  } catch (err) {
    console.error(`Error inspecting table: ${err.message}`);
    return null;
  }
}

/**
 * Check if column exists
 */
async function columnExists(tableName, columnName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);

    if (error && error.message.includes('column')) {
      return false;
    }
    
    return !error;
  } catch (err) {
    return false;
  }
}

/**
 * Main inspection function
 */
async function inspectDatabase() {
  console.log('\n🔍 DATABASE SCHEMA INSPECTOR\n');
  console.log('='.repeat(60));

  const tables = ['products', 'product_variants', 'vendors', 'users'];
  const schemaInfo = {};

  for (const table of tables) {
    const schema = await getTableSchema(table);
    if (schema) {
      schemaInfo[table] = schema;
    }
  }

  // Check for image columns
  console.log('\n\n📸 IMAGE COLUMN STATUS\n');
  console.log('='.repeat(60));

  const imageColumns = {
    'products': 'image_url',
    'product_variants': 'image_url',
    'vendors': 'image_url',
    'users': 'avatar_url'
  };

  for (const [table, column] of Object.entries(imageColumns)) {
    const exists = await columnExists(table, column);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${table}.${column}`);
  }

  // Get actual row counts
  console.log('\n\n📊 DATA STATISTICS\n');
  console.log('='.repeat(60));

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true });

      if (!error) {
        console.log(`${table}: ${count || 0} records`);
      }
    } catch (err) {
      console.log(`${table}: Unable to count`);
    }
  }

  // Show summary
  console.log('\n\n📋 SETUP SUMMARY\n');
  console.log('='.repeat(60));

  console.log('\nRequired for image management:');
  console.log('  ✅ products.image_url');
  console.log('  ⏳ product_variants.image_url (add if missing)');
  console.log('  ⏳ vendors.image_url (optional)');
  console.log('  ⏳ users.avatar_url (optional)');

  console.log('\nTo add missing columns, run:');
  console.log('  node setup-complete-integration.js');

  console.log('\n');
}

// Run inspection
inspectDatabase().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
