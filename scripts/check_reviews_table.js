import { supabase } from '../server/supabaseClient.js';

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
    console.dir(data, { depth: 3 });
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error querying reviews:', err);
    process.exit(1);
  }
})();
