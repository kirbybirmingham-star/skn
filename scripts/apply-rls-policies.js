import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function main() {
  console.log('='.repeat(80));
  console.log('APPLYING RLS POLICIES TO SUPABASE');
  console.log('='.repeat(80));
  console.log('\nThis script will apply the RLS policies via the Supabase management API.\n');

  // Read the consolidated schema to get the RLS policies
  const schemaSql = fs.readFileSync('supabase_migrations/consolidated_schema.sql', 'utf-8');
  
  // Extract RLS section (everything between "ROW LEVEL SECURITY POLICIES" and "COMMIT")
  const rlsMatch = schemaSql.match(/-- ROW LEVEL SECURITY POLICIES[\s\S]*?(?=COMMIT;)/);
  
  if (!rlsMatch) {
    console.error('Could not find RLS section in consolidated schema');
    return;
  }

  const rlsSql = rlsMatch[0];
  
  console.log('Attempting to apply RLS policies...\n');

  try {
    // Try to execute via Supabase admin API
    // Note: This might fail due to RLS limitations, but we'll try
    const { data, error } = await supabase.rpc('exec_sql', { sql: rlsSql });
    
    if (error) {
      console.log('⚠️  Cannot apply via RPC (expected due to RLS)');
      console.log('You need to apply the SQL manually:\n');
      console.log('='.repeat(80));
      console.log('MANUAL INSTRUCTIONS:');
      console.log('='.repeat(80));
      console.log('\n1. Go to: https://app.supabase.com/project/ebvlniuzrttvvgilccui/sql/');
      console.log('2. Click "New Query"');
      console.log('3. Copy and paste the following SQL:');
      console.log('\n' + '='.repeat(80));
      console.log(rlsSql);
      console.log('='.repeat(80));
      console.log('\n4. Click "Run"');
      console.log('\nThis will allow updates to products table for authenticated users.\n');
    } else {
      console.log('✓ RLS policies applied successfully!');
    }
  } catch (err) {
    console.log('⚠️  Error attempting to apply RLS:', err.message);
    console.log('\nYou need to apply the SQL manually:\n');
    console.log('='.repeat(80));
    console.log('MANUAL INSTRUCTIONS:');
    console.log('='.repeat(80));
    console.log('\n1. Go to: https://app.supabase.com/project/ebvlniuzrttvvgilccui/sql/');
    console.log('2. Click "New Query"');
    console.log('3. Copy and paste the following SQL:');
    console.log('\n' + '='.repeat(80));
    console.log(rlsSql);
    console.log('='.repeat(80));
    console.log('\n4. Click "Run"');
    console.log('\nThis will allow updates to products table for authenticated users.\n');
  }
}

main().catch(console.error);
