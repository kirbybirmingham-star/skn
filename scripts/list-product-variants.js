import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('Missing supabase env'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('product_variants').select('*').limit(5);
  if (error) { console.error('Error listing variants:', error); process.exit(1); }
  console.log('Sample product_variants rows:');
  console.log(JSON.stringify(data, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
