import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReviewsSchema() {
  console.log('=== CHECKING REVIEWS TABLE SCHEMA ===\n');

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${reviews?.length || 0} reviews`);
    if (reviews && reviews.length > 0) {
      console.log('\nColumns:', Object.keys(reviews[0]));
      console.log('\nSample review:');
      console.log(JSON.stringify(reviews[0], null, 2));
    } else {
      console.log('No reviews found - checking if table is empty or has different structure');
      
      // Try querying product_ratings
      const { data: pr } = await supabase
        .from('product_ratings')
        .select('*')
        .limit(1);
      
      if (pr && pr.length > 0) {
        console.log('\nProduct_ratings table has data:');
        console.log(JSON.stringify(pr[0], null, 2));
      }
    }
  }
}

checkReviewsSchema().catch(console.error);
