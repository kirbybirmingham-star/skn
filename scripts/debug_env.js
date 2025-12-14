import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
console.log('Loading from:', envPath);

dotenv.config({ path: envPath });

console.log('Environment Variables:');
console.log('  VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✓' : '✗');
console.log('  VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✓' : '✗');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
console.log('\nServer config would have:');
console.log('  url:', process.env.VITE_SUPABASE_URL ? 'SET' : 'EMPTY');
console.log('  anonKey:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'EMPTY');
console.log('  serviceRoleKey:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'EMPTY');
