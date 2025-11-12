import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in repo root
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Verbose/debug mode: set DEBUG=1 or pass --verbose
const VERBOSE = process.argv.includes('--verbose') || process.env.DEBUG === '1' || String(process.env.DEBUG).toLowerCase() === 'true';

async function main() {
  console.log('Testing Supabase connection and permissions...\n');
  
  try {
    // Try to list users (requires proper service role key)
    console.log('1. Testing auth.admin.listUsers...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ Cannot list users:', usersError.message);
      if (VERBOSE) console.error('Details:', usersError);
    } else {
      console.log('✓ Can list users! Current count:', users?.users?.length || 0);
      if (VERBOSE) console.log('Users response:', users);
    }

    // Try to create a test user
    console.log('\n2. Testing user creation...');
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: 'test.delete.me@example.com',
      password: 'test1234',
      email_confirm: true
    });

    if (createError) {
      console.error('❌ Cannot create users:', createError.message);
      if (VERBOSE) console.error('Details:', createError);
    } else {
      console.log('✓ Created test user:', authData.user.email);
      if (VERBOSE) console.log('Create response:', authData);
      // Clean up by deleting the test user
      if (authData.user.id) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
        if (deleteError) {
          console.error('❌ Could not delete test user:', deleteError.message);
          if (VERBOSE) console.error('Details:', deleteError);
        } else {
          console.log('✓ Deleted test user');
        }
      }
    }

    // Test basic table access
    console.log('\n3. Testing database access...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profilesError) {
      console.error('❌ Cannot access profiles table:', profilesError.message);
      if (VERBOSE) console.error('Details:', profilesError);
    } else {
      console.log('✓ Can access profiles table');
      if (VERBOSE) console.log('Profiles response sample:', profilesData);
    }
    
  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message);
  }
}

main();