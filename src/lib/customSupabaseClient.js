import { createClient } from '@supabase/supabase-js';

// Use Vite's import.meta.env for client-side, and process.env for server-side
const supabaseUrl = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Config:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey
});

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    // keep logs minimal in production
    if (import.meta.env && import.meta.env.DEV) console.log('Supabase client initialized');
  } catch (err) {
    console.warn('Failed to initialize Supabase client, falling back to in-memory store', err);
    supabase = null;
  }
} else {
  const isDev = (import.meta.env && import.meta.env.DEV) || process.env.NODE_ENV === 'development';
  if (isDev) {
    console.warn('Supabase env vars not present. Running in in-memory fallback mode.');
  }
}

export { supabase };

