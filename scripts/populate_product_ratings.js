import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log('Populating product_ratings from existing reviews...\n');

    // Get all products with reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('product_id, rating');

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError.message);
      process.exit(1);
    }

    // Group by product_id and calculate aggregates
    const aggregates = {};
    reviews.forEach(r => {
      if (!aggregates[r.product_id]) {
        aggregates[r.product_id] = { ratings: [], count: 0 };
      }
      aggregates[r.product_id].ratings.push(Number(r.rating));
      aggregates[r.product_id].count++;
    });

    // Prepare upsert data
    const upsertData = Object.entries(aggregates).map(([product_id, agg]) => {
      const avg = (agg.ratings.reduce((a, b) => a + b, 0) / agg.count).toFixed(2);
      return {
        product_id,
        avg_rating: parseFloat(avg),
        review_count: agg.count
      };
    });

    console.log(`Found ${upsertData.length} products with reviews.`);
    console.log(`Total upsert records: ${upsertData.length}\n`);

    // Upsert into product_ratings
    if (upsertData.length > 0) {
      const { error: upsertError } = await supabase
        .from('product_ratings')
        .upsert(upsertData);

      if (upsertError) {
        console.error('Error upserting product_ratings:', upsertError.message);
        process.exit(1);
      }

      console.log('✅ Upserted product_ratings successfully!\n');

      // Verify
      const { data: populated } = await supabase
        .from('product_ratings')
        .select('*');

      console.log(`product_ratings now has ${populated?.length || 0} rows:`);
      populated?.forEach(r => {
        console.log(`  - Product ${r.product_id.substring(0, 8)}...: ${r.avg_rating} avg, ${r.review_count} reviews`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
