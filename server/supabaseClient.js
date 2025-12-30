import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, FEATURE_FLAGS } from './config.js';

const supabaseUrl = SUPABASE_CONFIG.url;
// Use service role key for backend operations (bypasses RLS)
// Fall back to anon key if service role not available
const supabaseKey = SUPABASE_CONFIG.serviceRoleKey || SUPABASE_CONFIG.anonKey;

// Debug: Log what environment variables we're reading
console.log('[supabaseClient] process.env check:', {
  SUPABASE_URL: process.env.SUPABASE_URL || 'undefined',
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'undefined',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '(present)' : 'undefined',
  VITE_SUPABASE_SERVICE_ROLE_KEY: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '(present)' : 'undefined'
});

// Log in debug mode or development
if (FEATURE_FLAGS.debug || FEATURE_FLAGS.isDevelopment) {
  console.log('[supabaseClient] Config Check:', {
    url: supabaseUrl ? (supabaseUrl.substring(0, 30) + '...') : 'MISSING',
    hasAnonKey: !!SUPABASE_CONFIG.anonKey,
    hasServiceRoleKey: !!SUPABASE_CONFIG.serviceRoleKey,
    usingServiceRole: !!SUPABASE_CONFIG.serviceRoleKey,
    environment: FEATURE_FLAGS.isDevelopment ? 'development' : 'production'
  });
}

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[supabaseClient] ✅ Supabase client initialized successfully');
  } catch (err) {
    console.warn('[supabaseClient] ❌ Failed to initialize Supabase client:', err.message);
    supabase = null;
  }
} else {
  console.warn('[supabaseClient] ⚠️ Supabase env vars not present:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    details: 'Server will not be able to fetch real dashboard data'
  });
}

export { supabase };