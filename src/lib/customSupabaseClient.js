import { createClient } from '@supabase/supabase-js';

// Use Vite's import.meta.env (available in dev/build). If the vars are not set
// we fall back to a null supabase client so the app can run with in-memory data.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    // keep logs minimal in production
    if (import.meta.env.DEV) console.log('Supabase client initialized');
  } catch (err) {
    console.warn('Failed to initialize Supabase client, falling back to in-memory store', err);
    supabase = null;
  }
} else {
  if (import.meta.env.DEV) {
    console.warn('Supabase env vars not present. Running in in-memory fallback mode.');
  }
}

export { supabase };

