import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  if (!supabase) {
    console.error('Supabase client not initialized. Check .env variables.');
    process.exit(2);
  }

  try {
    console.log('Querying reviews table (limit 10)');
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
    if (data.length > 0) {
      console.log('\nColumns:', Object.keys(data[0]));
      console.log('\nSample review:');
      console.dir(data[0], { depth: 3 });
    } else {
      console.log('No reviews in table');
    }
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error querying reviews:', err);
    process.exit(1);
  }
})();
