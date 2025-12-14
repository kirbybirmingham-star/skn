import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, FEATURE_FLAGS } from '../config/environment.js';

let supabaseUrl;
let supabaseAnonKey;

// Use centralized config from environment.js
supabaseUrl = SUPABASE_CONFIG.url;
supabaseAnonKey = SUPABASE_CONFIG.anonKey;

// Only log in development or debug mode
if (FEATURE_FLAGS.debug || (typeof import.meta.env !== 'undefined' && import.meta.env.DEV)) {
  console.log('Supabase Config:', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey
  });
}

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    if (FEATURE_FLAGS.debug || (typeof import.meta.env !== 'undefined' && import.meta.env.DEV)) {
      console.log('✅ Supabase client initialized');
    }
  } catch (err) {
    console.warn('Failed to initialize Supabase client, falling back to in-memory store', err);
    supabase = null;
  }
} else {
  const isDev = (typeof import.meta.env !== 'undefined' && import.meta.env.DEV) || process.env.NODE_ENV === 'development';
  if (isDev || FEATURE_FLAGS.debug) {
    console.warn('⚠️ Supabase env vars not present. Running in in-memory fallback mode.');
  }
}

export { supabase };