import { createClient } from '@supabase/supabase-js';

let supabaseUrl;
let supabaseAnonKey;

// Check if we are in a Vite (client-side) environment
if (typeof import.meta.env !== 'undefined') {
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
} else {
  // We are in a Node.js (server-side) environment
  // The server/index.js should have already loaded dotenv
  supabaseUrl = process.env.VITE_SUPABASE_URL;
  supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
}

console.log('Supabase Config:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey
});

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    if (typeof import.meta.env !== 'undefined' && import.meta.env.DEV) {
      console.log('Supabase client initialized');
    }
  } catch (err) {
    console.warn('Failed to initialize Supabase client, falling back to in-memory store', err);
    supabase = null;
  }
} else {
  const isDev = (typeof import.meta.env !== 'undefined' && import.meta.env.DEV) || process.env.NODE_ENV === 'development';
  if (isDev) {
    console.warn('Supabase env vars not present. Running in in-memory fallback mode.');
  }
}

export { supabase };