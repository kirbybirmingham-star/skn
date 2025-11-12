import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('Missing SUPABASE env'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Checking for product_ratings and vendor_ratings relations...');
  try {
    const { data: pr, error: e1 } = await supabase.from('product_ratings').select('id').limit(1);
    if (e1) {
      console.log('product_ratings query error:', e1.message);
    } else {
      console.log('product_ratings exists (sample row count:', pr?.length || 0, ')');
    }

    const { data: vr, error: e2 } = await supabase.from('vendor_ratings').select('id').limit(1);
    if (e2) {
      console.log('vendor_ratings query error:', e2.message);
    } else {
      console.log('vendor_ratings exists (sample row count:', vr?.length || 0, ')');
    }
  } catch (err) {
    console.error('Unexpected:', err.message || err);
  }
}

main().catch(console.error);
