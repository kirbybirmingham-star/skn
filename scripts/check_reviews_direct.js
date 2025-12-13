import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env from repo root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase env vars missing. VITE_SUPABASE_URL or keys not found.');
  process.exit(2);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log('Querying reviews table (limit 10) using direct client');
    const { data, error } = await supabase
      .from('reviews')
      .select('id, product_id, rating, title, body, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching reviews:', error.message || error);
      process.exit(1);
    }

    console.log(`Fetched ${data.length} reviews:`);
    console.dir(data, { depth: 3 });
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error querying reviews:', err);
    process.exit(1);
  }
})();
