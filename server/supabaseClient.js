import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use service role key for backend operations (bypasses RLS)
// Fall back to anon key if service role not available
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Config:', {
  url: supabaseUrl,
  hasAnonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
  hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  usingServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
});

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client', err);
    supabase = null;
  }
} else {
    console.warn('Supabase env vars not present. The server will not be able to connect to Supabase.');
}

export { supabase };