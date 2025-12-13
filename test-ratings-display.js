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

async function testRatingsDisplay() {
  console.log('Testing product ratings display...\n');

  // Get all products - proper foreign key relationship
  console.log('--- Fetching products with product_ratings relation ---');
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      title,
      product_ratings (
        id,
        avg_rating,
        review_count
      )
    `)
    .limit(5);

  if (error) {
    console.error('Error fetching products:', error);
  } else if (products) {
    console.log(`Found ${products.length} products:\n`);

    for (const product of products) {
      console.log(`Product: ${product.title} (ID: ${product.id})`);
      
      if (product.product_ratings && product.product_ratings.length > 0) {
        const rating = product.product_ratings[0];
        console.log(`  ✓ Has ratings:`);
        console.log(`    - Avg Rating: ${rating.avg_rating}`);
        console.log(`    - Review Count: ${rating.review_count}`);
      } else {
        console.log(`  ✗ No ratings yet`);
      }
      console.log('');
    }
  }

  // Check the actual reviews table
  console.log('\n--- Reviews in database ---');
  const { data: reviews, error: reviewError } = await supabase
    .from('reviews')
    .select('id, product_id, rating, title')
    .limit(10);

  if (reviewError) {
    console.error('Error fetching reviews:', reviewError);
  } else if (reviews && reviews.length > 0) {
    console.log(`Found ${reviews.length} reviews:`);
    for (const review of reviews) {
      console.log(`  - Product ${review.product_id}: ${review.rating}⭐ - "${review.title}"`);
    }
  } else {
    console.log('No reviews found in database');
  }

  // Check product_ratings table directly
  console.log('\n--- Product ratings table ---');
  const { data: ratings, error: ratingsError } = await supabase
    .from('product_ratings')
    .select('*')
    .limit(10);

  if (ratingsError) {
    console.error('Error fetching product_ratings:', ratingsError);
  } else if (ratings && ratings.length > 0) {
    console.log(`Found ${ratings.length} product ratings:`);
    for (const rating of ratings) {
      console.log(`  - Product ${rating.product_id}: ${rating.avg_rating}⭐ (${rating.review_count} reviews)`);
    }
  } else {
    console.log('No product ratings found');
  }
}

testRatingsDisplay().catch(console.error);
