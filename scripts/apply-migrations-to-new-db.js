#!/usr/bin/env node

/**
 * Apply all Supabase migrations to initialize the database schema
 * Run with: node scripts/apply-migrations-to-new-db.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;


if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// List of migration files to apply (in order)
const migrations = [
  'init_schema.sql',
  'add_onboarding_columns.sql',
  'add_product_images.sql',
  'add_gallery_images.sql',
  'normalize_variants.sql',
  'storage_setup.sql',
  'update_schema_for_app_requirements.sql',
  'enhanced_order_management.sql'
];

async function applyMigrations() {
  console.log('🚀 Starting database migrations...\n');
  
  for (const migration of migrations) {
    const migrationPath = path.join(__dirname, '..', 'supabase_migrations', migration);
    
    if (!fs.existsSync(migrationPath)) {
      console.warn(`⚠️  Migration file not found: ${migration}`);
      continue;
    }

    try {
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      
      console.log(`📝 Applying: ${migration}`);
      
      // Execute the SQL
      const { error } = await supabase.rpc('exec', { sql_str: sql }).catch(err => {
        // If exec RPC doesn't exist, try direct query execution
        return supabase.query(sql);
      });

      if (error) {
        // Some errors are expected (like "already exists"), so just log as warning
        console.warn(`   ⚠️  ${error.message}`);
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }

  console.log('\n✅ Migration process complete!');
  console.log('\nNext steps:');
  console.log('1. Verify tables in Supabase dashboard');
  console.log('2. Restart dev servers: npm run dev:all');
  console.log('3. Test seller signup');
}

applyMigrations();
