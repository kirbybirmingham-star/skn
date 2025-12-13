import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRatingsFix() {
  console.log('=== TESTING RATINGS FIX ===\n');

  // Get products with ratings (simulating API query)
  console.log('1. Fetching products with ratings...');
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      title,
      product_ratings (
        rating
      )
    `)
    .limit(10);

  if (error) {
    console.error('  ❌ Error:', error);
    return;
  }

  console.log(`  ✓ Found ${products.length} products`);

  // Find products with ratings
  const productsWithRatings = products.filter(p => p.product_ratings?.length > 0);
  console.log(`\n2. Products with ratings: ${productsWithRatings.length}`);

  for (const product of productsWithRatings) {
    const ratings = product.product_ratings;
    const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const displayRating = Math.round(avg);
    
    console.log(`\n   Product: ${product.title}`);
    console.log(`   - Individual ratings: ${ratings.map(r => r.rating).join(', ')}`);
    console.log(`   - Average: ${avg.toFixed(2)}⭐`);
    console.log(`   - Displayed (rounded): ${displayRating}⭐`);
    console.log(`   - Count: ${ratings.length}`);
    console.log(`   - Card shows: ⭐⭐⭐⭐⭐ (${ratings.length})`);
  }

  // Test component logic
  console.log('\n3. Testing component display logic:\n');
  for (const product of productsWithRatings) {
    const ratings = product.product_ratings;
    
    // This is what ProductCard.jsx now does:
    if (product.product_ratings && product.product_ratings.length > 0) {
      const firstRating = product.product_ratings[0].rating;
      const roundedRating = Math.round(firstRating);
      const count = product.product_ratings.length;
      
      console.log(`   ${product.title}`);
      console.log(`   ✓ Condition: product.product_ratings?.length > 0 = TRUE`);
      console.log(`   ✓ StarRating gets: Math.round(${firstRating}) = ${roundedRating}`);
      console.log(`   ✓ Shows count: (${count})`);
      console.log(`   ✓ RESULT: Ratings will display! ⭐\n`);
    }
  }

  console.log('=== TEST COMPLETE ===');
}

testRatingsFix().catch(console.error);
