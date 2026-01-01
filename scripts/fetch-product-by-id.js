import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE URL or KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PRODUCT_ID = process.argv[2] || '185c65f0-2edc-4553-90a5-1ac0b972be06';

async function main() {
  console.log('Fetching product id', PRODUCT_ID);
  // Try selecting ratings relation; if missing, retry without it.
  let res = await supabase
    .from('products')
    .select(`*
      , product_variants(id, name, images)
      , product_ratings(*)
    `)
    .eq('id', PRODUCT_ID)
    .maybeSingle();

  if (res.error && String(res.error.message || '').includes('Could not find a relationship')) {
    console.warn('product_ratings relation missing; retrying without it');
    res = await supabase
      .from('products')
      .select(`*
        , product_variants(id, name, images)
      `)
      .eq('id', PRODUCT_ID)
      .maybeSingle();
  }

  if (res.error) {
    console.error('Error fetching product:', res.error);
    process.exit(1);
  }

  console.log('Product object:');
  console.log(JSON.stringify(res.data, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });
