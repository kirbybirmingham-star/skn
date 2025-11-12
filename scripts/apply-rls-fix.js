import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
  process.exit(1);
}

const migrationSql = `
-- Migration: Fix Profiles RLS Policies
-- Date: 2025-11-11

BEGIN;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Everyone can view profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can delete profiles" ON public.profiles
    FOR DELETE USING (auth.jwt()->>'role' = 'service_role');

COMMIT;
`;

async function applyMigrationViaRest() {
  try {
    console.log('Applying RLS fix via Supabase REST API...\n');
    
    // Use fetch to call a custom RPC function or try a workaround
    // Actually, let's try using the REST API's built-in SQL execution if available
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql_query: migrationSql }),
    });

    if (response.ok) {
      console.log('✓ Migration applied successfully!');
      return;
    }

    if (response.status === 404) {
      console.log('⚠️  exec_sql RPC not available. Trying alternative method...\n');
      
      // Alternative: Use Supabase's direct SQL endpoint (if available)
      const altResponse = await fetch(`${supabaseUrl}/rest/v1/sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: migrationSql }),
      });

      if (altResponse.ok) {
        console.log('✓ Migration applied successfully via SQL endpoint!');
        return;
      }

      console.log('SQL endpoint also unavailable.');
    }

    // If we can't apply via API, show instructions
    console.log('Please apply this SQL migration manually via the Supabase dashboard:\n');
    console.log('1. Go to https://app.supabase.com/project');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor -> New Query');
    console.log('4. Paste this SQL:\n');
    console.log('='.repeat(60));
    console.log(migrationSql);
    console.log('='.repeat(60));
    console.log('\n5. Click "Run"\n');

  } catch (err) {
    console.error('Error applying migration:', err.message);
    console.log('\nPlease apply the SQL migration manually. See SQL above.');
    process.exit(1);
  }
}

applyMigrationViaRest();
