import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRatingsStructure() {
  console.log('--- Checking product_ratings table structure ---\n');

  // Get product_ratings with all fields
  const { data: ratings, error } = await supabase
    .from('product_ratings')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Raw product_ratings data:');
    console.log(JSON.stringify(ratings, null, 2));
  }

  // Check reviews
  console.log('\n--- Reviews table ---\n');
  const { data: reviews, error: reviewError } = await supabase
    .from('reviews')
    .select('*')
    .limit(5);

  if (reviewError) {
    console.error('Error:', reviewError);
  } else {
    console.log('Raw reviews data:');
    console.log(JSON.stringify(reviews, null, 2));
  }
}

testRatingsStructure().catch(console.error);
