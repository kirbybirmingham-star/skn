import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

(async () => {
  try {
    console.log('Querying reviews table...\n');
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    console.log(`Found ${data.length} reviews`);
    if (data.length > 0) {
      console.log('\nColumns:', Object.keys(data[0]));
      console.log('\nFirst review:');
      console.log(JSON.stringify(data[0], null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
