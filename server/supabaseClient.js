import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, FEATURE_FLAGS } from './config.js';

const supabaseUrl = SUPABASE_CONFIG.url;
// Use service role key for backend operations (bypasses RLS)
// Fall back to anon key if service role not available
const supabaseKey = SUPABASE_CONFIG.serviceRoleKey || SUPABASE_CONFIG.anonKey;

// Only log in debug mode or development
if (FEATURE_FLAGS.debug || FEATURE_FLAGS.isDevelopment) {
  console.log('Supabase Config:', {
    url: supabaseUrl.substring(0, 30) + '...',
    hasAnonKey: !!SUPABASE_CONFIG.anonKey,
    hasServiceRoleKey: !!SUPABASE_CONFIG.serviceRoleKey,
    usingServiceRole: !!SUPABASE_CONFIG.serviceRoleKey
  });
}

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    if (FEATURE_FLAGS.debug || FEATURE_FLAGS.isDevelopment) {
      console.log('✅ Supabase client initialized');
    }
  } catch (err) {
    console.warn('Failed to initialize Supabase client', err);
    supabase = null;
  }
} else {
  if (FEATURE_FLAGS.debug || FEATURE_FLAGS.isDevelopment) {
    console.warn('⚠️ Supabase env vars not present. The server will not be able to connect to Supabase.');
  }
}

export { supabase };