import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReviewsTables() {
  console.log('=== CHECKING REVIEWS TABLES ===\n');

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .limit(5);

  console.log('Reviews table:', reviews?.length || 0, 'rows');
  if (reviews?.length > 0) {
    console.log('Columns:', Object.keys(reviews[0]));
    console.log('Sample:', JSON.stringify(reviews[0], null, 2));
  }

  const { data: pr } = await supabase
    .from('product_ratings')
    .select('*')
    .limit(5);

  console.log('\nProduct_ratings table:', pr?.length || 0, 'rows');
  if (pr?.length > 0) {
    console.log('Columns:', Object.keys(pr[0]));
    console.log('Sample:', JSON.stringify(pr[0], null, 2));
  }
}

checkReviewsTables().catch(console.error);
