import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Attempting products select with fallback logic...');
  let productsQuery = supabase.from('products').select('*, product_ratings(*)').order('created_at', { ascending: false });
  try {
    const { error: countErr } = await productsQuery.select('id', { count: 'exact', head: true });
    if (countErr) {
      console.log('Count with ratings failed, retrying without relation');
      productsQuery = supabase.from('products').select('*').order('created_at', { ascending: false });
    } else {
      console.log('Count with ratings succeeded');
    }
  } catch (err) {
    console.log('Count query threw, retrying without relation', err.message || err);
    productsQuery = supabase.from('products').select('*').order('created_at', { ascending: false });
  }

  const { data, error } = await productsQuery.range(0, 2);
  if (error) {
    console.error('Final products query failed:', error);
  } else {
    console.log('Final products result sample:');
    console.log(JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
