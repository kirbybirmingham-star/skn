/**
 * Supabase SQL Executor
 * Runs SQL queries directly against Supabase database using SQL editor
 * 
 * Alternative: Use this script to execute via RPC if available
 * Or copy-paste the SQL queries directly into Supabase SQL Editor
 * 
 * Usage: node execute-setup-sql.js
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
 * SQL queries to execute
 */
const setupQueries = [
  {
    name: 'Add image_url to product_variants',
    sql: 'ALTER TABLE product_variants ADD COLUMN image_url VARCHAR(255);',
    description: 'Enables variant-specific images'
  },
  {
    name: 'Add image_url to vendors',
    sql: 'ALTER TABLE vendors ADD COLUMN image_url VARCHAR(255);',
    description: 'Enables vendor profile images'
  },
  {
    name: 'Add avatar_url to users',
    sql: 'ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255);',
    description: 'Enables user avatars'
  },
  {
    name: 'Create indexes for image_url columns',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_product_variants_image_url ON product_variants(image_url);
      CREATE INDEX IF NOT EXISTS idx_vendors_image_url ON vendors(image_url);
      CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_url);
    `,
    description: 'Optimize image queries'
  }
];

/**
 * Execute SQL queries with error handling
 */
async function executeSetupQueries() {
  console.log('\n🚀 SUPABASE SQL EXECUTION\n');
  console.log('='.repeat(70));

  console.log('\n📋 SETUP QUERIES TO EXECUTE:\n');

  // Show all queries
  setupQueries.forEach((query, idx) => {
    console.log(`\n${idx + 1}. ${query.name}`);
    console.log(`   Description: ${query.description}`);
    console.log(`   SQL: ${query.sql.substring(0, 50)}...`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('\n⚠️  MANUAL EXECUTION REQUIRED\n');
  console.log('Follow these steps:\n');

  console.log('1. Open Supabase Dashboard:');
  console.log(`   ${SUPABASE_URL}\n`);

  console.log('2. Navigate to: SQL Editor\n');

  console.log('3. Create a new query and paste the SQL below:\n');

  console.log('-'.repeat(70));
  setupQueries.forEach((query) => {
    console.log(`\n-- ${query.name}`);
    console.log(`-- ${query.description}`);
    console.log(query.sql);
  });
  console.log('-'.repeat(70));

  console.log('\n4. Run the query (Ctrl+Enter)\n');

  console.log('5. Verify the columns were created:\n');
  console.log('   $ node inspect-database-schema.js\n');

  console.log('='.repeat(70) + '\n');

  // Try alternative: Direct SQL via RPC
  console.log('💡 ALTERNATIVE: If you have stored procedure access...\n');
  
  try {
    // Try to execute via raw query
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: setupQueries[0].sql
    }).catch(() => {
      throw new Error('RPC not available - use manual method above');
    });

    if (error) throw error;

    console.log('✅ RPC method succeeded!\n');
    
    for (const query of setupQueries) {
      const { error: execError } = await supabase.rpc('execute_sql', {
        sql: query.sql
      }).catch(() => ({ error: { message: 'RPC failed' } }));

      if (execError) {
        console.log(`❌ ${query.name}: ${execError.message}`);
      } else {
        console.log(`✅ ${query.name}`);
      }
    }
  } catch (err) {
    console.log('ℹ️  RPC execution not available - use manual method above\n');
  }

  console.log('\n');
}

// Run execution
executeSetupQueries().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
