import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkComprehensiveProducts() {
  try {
    console.log('Checking comprehensive product data...\n');

    // Get all products with variants and reviews
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        slug,
        description,
        base_price,
        currency,
        is_published,
        created_at,
        product_variants (
          id,
          price_in_cents,
          inventory_quantity,
          is_active,
          attributes
        ),
        reviews (
          id,
          rating,
          title,
          body,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    console.log(`Found ${products.length} products:\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   Slug: ${product.slug}`);
      console.log(`   Price: $${(product.base_price / 100).toFixed(2)} ${product.currency}`);
      console.log(`   Published: ${product.is_published ? 'Yes' : 'No'}`);
      console.log(`   Description: ${product.description ? product.description.substring(0, 100) + '...' : 'No description'}`);
      console.log(`   Variants: ${product.product_variants?.length || 0}`);
      console.log(`   Reviews: ${product.reviews?.length || 0}`);

      if (product.reviews && product.reviews.length > 0) {
        const avgRating = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;
        console.log(`   Average Rating: ${avgRating.toFixed(1)}/5`);
      }

      console.log('');
    });

    // Summary statistics
    const totalVariants = products.reduce((sum, p) => sum + (p.product_variants?.length || 0), 0);
    const totalReviews = products.reduce((sum, p) => sum + (p.reviews?.length || 0), 0);
    const publishedProducts = products.filter(p => p.is_published).length;

    console.log('Summary:');
    console.log(`- Total Products: ${products.length}`);
    console.log(`- Published Products: ${publishedProducts}`);
    console.log(`- Total Variants: ${totalVariants}`);
    console.log(`- Total Reviews: ${totalReviews}`);
    console.log(`- Average Reviews per Product: ${(totalReviews / products.length).toFixed(1)}`);

  } catch (error) {
    console.error('Error checking comprehensive products:', error);
  }
}

checkComprehensiveProducts();