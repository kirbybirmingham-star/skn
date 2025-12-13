import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeRatings() {
  console.log('=== ANALYZING RATINGS DATA ===\n');

  // Get the product with a rating
  const { data: productsWithRatings, error: error1 } = await supabase
    .from('products')
    .select('id, title')
    .eq('id', '0d39966f-d67f-4e45-94d5-81f10d48bbc4');

  if (productsWithRatings?.length > 0) {
    console.log('Product with rating:');
    console.log(`  ID: ${productsWithRatings[0].id}`);
    console.log(`  Title: ${productsWithRatings[0].title}\n`);
  }

  // Get all ratings for this product
  const { data: ratings, error: error2 } = await supabase
    .from('product_ratings')
    .select('*')
    .eq('product_id', '0d39966f-d67f-4e45-94d5-81f10d48bbc4');

  if (ratings) {
    console.log(`Found ${ratings.length} rating(s) for this product:`);
    for (const r of ratings) {
      console.log(`  - Rating: ${r.rating}⭐`);
      console.log(`    User: ${r.user_id}`);
      console.log(`    Comment: ${r.comment}`);
    }
  }

  // Calculate aggregates client-side
  if (ratings && ratings.length > 0) {
    const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    console.log(`\nCalculated aggregates:`);
    console.log(`  Average: ${avg.toFixed(2)}⭐`);
    console.log(`  Count: ${ratings.length}`);
  }

  // Check what the queries expect
  console.log('\n=== QUERY FORMAT CHECK ===\n');
  console.log('Current code expects: product.product_ratings as a SINGLE object with:');
  console.log('  - avg_rating: decimal');
  console.log('  - review_count: integer');
  console.log('\nActual data has: product_ratings as ARRAY of objects with:');
  console.log('  - rating: integer');
  console.log('  - user_id, comment, etc.');
}

analyzeRatings().catch(console.error);
