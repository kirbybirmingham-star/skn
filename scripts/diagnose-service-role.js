import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function diagnoseServiceRole() {
  console.log('=== Supabase Service Role Diagnostic ===\n');
  
  // Test 1: Check if service role can access auth admin
  console.log('1. Testing auth.admin.listUsers (requires service role)...');
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('   ❌ FAILED:', error.message);
    } else {
      console.log('   ✓ SUCCESS: Can list users. Count:', data?.users?.length || 0);
    }
  } catch (err) {
    console.error('   ❌ EXCEPTION:', err.message);
  }

  // Test 2: Check storage buckets
  console.log('\n2. Testing storage.listBuckets (lists all buckets)...');
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('   ❌ FAILED:', error.message);
    } else {
      console.log('   ✓ SUCCESS: Found buckets:');
      data?.forEach(b => console.log(`      - ${b.name} (id: ${b.id})`));
    }
  } catch (err) {
    console.error('   ❌ EXCEPTION:', err.message);
  }

  // Test 3: Check if profiles table is accessible
  console.log('\n3. Testing profiles table SELECT (should work with service role)...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(3);
    
    if (error) {
      console.error('   ❌ FAILED:', error.message);
      if (error.code === '42501') {
        console.error('   This is RLS permission denied - profiles table RLS policies are too restrictive');
      }
    } else {
      console.log('   ✓ SUCCESS: Can query profiles. Count:', data?.length || 0);
      data?.slice(0, 2).forEach(p => console.log(`      - ${p.email} (${p.role})`));
    }
  } catch (err) {
    console.error('   ❌ EXCEPTION:', err.message);
  }

  // Test 4: Check if products table is accessible
  console.log('\n4. Testing products table SELECT (should work with service role)...');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('slug, title')
      .limit(3);
    
    if (error) {
      console.error('   ❌ FAILED:', error.message);
      if (error.code === '42501') {
        console.error('   This is RLS permission denied - products table RLS policies are too restrictive');
      }
    } else {
      console.log('   ✓ SUCCESS: Can query products. Count:', data?.length || 0);
      data?.forEach(p => console.log(`      - ${p.slug}: ${p.title}`));
    }
  } catch (err) {
    console.error('   ❌ EXCEPTION:', err.message);
  }

  console.log('\n=== Summary ===');
  console.log('If auth tests pass but profiles/products fail with code 42501:');
  console.log('→ The service role key is working, but RLS policies block table access');
  console.log('→ Apply the RLS fix from RLS_FIX_GUIDE.md\n');
}

diagnoseServiceRole().catch(console.error);
