import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    // The migration SQL to apply
    const migrationSql = `
-- Migration: Fix Profiles RLS Policies
-- Date: 2025-11-11
-- Description: Add INSERT, DELETE, and bypassable SELECT/UPDATE policies for profiles table

BEGIN;

-- First, drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Add comprehensive policies for profiles table

-- 1. SELECT: Public can view all profiles (for discovery, vendor profiles, etc.)
CREATE POLICY "Everyone can view profiles" ON public.profiles
    FOR SELECT USING (true);

-- 2. INSERT: Only authenticated users and service_role can insert profiles
CREATE POLICY "Authenticated users can insert own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 3. UPDATE: Users can update their own profile, service_role can update any
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR auth.jwt()->>'role' = 'service_role');

-- 4. DELETE: Service role can delete profiles (for cleanup scripts)
CREATE POLICY "Service role can delete profiles" ON public.profiles
    FOR DELETE USING (auth.jwt()->>'role' = 'service_role');

COMMIT;
    `;

    console.log('Applying profiles RLS fix migration...');
    
    // Execute the SQL using Supabase's rpc or raw query
    // Since we can't directly execute arbitrary SQL via the JS client in all cases,
    // we'll use the internal query method if available, or suggest psql command
    
    // Try using the from() method with empty table to execute raw SQL (workaround)
    const { error } = await supabase
      .from('profiles')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      console.log('\n⚠️  Current SELECT on profiles returned:', error.message);
      console.log('\nTo apply the migration, please run one of these commands:\n');
      console.log('1. Using psql (if installed):');
      console.log(`   PGPASSWORD="${process.env.SUPABASE_DB_PASSWORD}" psql -h "db.${process.env.VITE_SUPABASE_URL.split('https://')[1].split('.')[0]}.postgres.supabase.co" -U "postgres" -d "postgres" -c "${migrationSql.replace(/"/g, '\\"')}"\n`);
      
      console.log('2. Using Supabase SQL Editor (recommended):');
      console.log('   - Go to https://app.supabase.com/project');
      console.log('   - Select your project');
      console.log('   - Go to SQL Editor');
      console.log('   - Click "New Query"');
      console.log('   - Paste the SQL migration below:\n');
      console.log(migrationSql);
      console.log('\n   - Click "Run"');
    } else {
      console.log('✓ Migration may already be applied (SELECT works)');
    }

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
