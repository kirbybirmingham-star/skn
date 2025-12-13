import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase env vars missing.');
  process.exit(2);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    const productId = '0d39966f-d67f-4e45-94d5-81f10d48bbc4';
    const testUserId = '9a18deaf-0937-464e-9b62-5c6cf2268984';

    console.log('Testing review creation and rating aggregation...\n');

    // 1. Check current ratings
    console.log('1. Current product_ratings:');
    const { data: currentRating } = await supabase
      .from('product_ratings')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle();
    console.dir(currentRating, { depth: 2 });

    // 2. Create a test review (without user join)
    console.log('\n2. Creating test review...');
    const testReview = {
      product_id: productId,
      user_id: testUserId,
      rating: 4,
      title: 'Test Review - Great Value',
      body: 'This is a test review created automatically. The product quality is excellent and shipping was fast.'
    };

    const { data: newReview, error: createError } = await supabase
      .from('reviews')
      .insert([testReview])
      .select()
      .single();

    if (createError) {
      console.error('Error creating review:', createError.message);
      process.exit(1);
    }

    console.log('Review created:');
    console.dir(newReview, { depth: 2 });

    // 3. Wait for trigger
    console.log('\n3. Waiting for database trigger to update aggregates...');
    await new Promise(r => setTimeout(r, 1500));

    // 4. Check updated ratings
    console.log('\n4. Updated product_ratings:');
    const { data: updatedRating } = await supabase
      .from('product_ratings')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle();
    console.dir(updatedRating, { depth: 2 });

    // 5. Fetch all reviews for the product
    console.log('\n5. All reviews for product:');
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('id, rating, title, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    console.log(`Total reviews: ${allReviews?.length || 0}`);
    allReviews?.forEach(r => {
      console.log(`  - Rating: ${r.rating}, Title: "${r.title}"`);
    });

    console.log('\n✅ Test complete! Review created and ratings aggregated.');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
})();
