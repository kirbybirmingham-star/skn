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

async function testReviewsSystem() {
  try {
    console.log('Testing reviews system...\n');

    // Get a product to test with
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title')
      .limit(1);

    if (productsError || !products || products.length === 0) {
      console.error('No products found to test reviews with');
      return;
    }

    const testProduct = products[0];
    console.log(`Testing reviews for product: ${testProduct.title} (ID: ${testProduct.id})\n`);

    // Test 1: Get reviews for the product
    console.log('1. Testing getReviews API...');
    try {
      const response = await fetch(`http://localhost:3001/api/reviews/${testProduct.id}`);
      if (response.ok) {
        const reviews = await response.json();
        console.log(`   ✓ Found ${reviews.length} reviews for the product`);
      } else {
        console.log(`   ✗ Failed to fetch reviews: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ✗ Error fetching reviews: ${error.message}`);
    }

    // Test 2: Create a review
    console.log('\n2. Testing createReview API...');

    // First, get an existing user
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError || !users || users.users.length === 0) {
      console.log('   ✗ No users found in auth system');
      return;
    }

    const testUser = users.users[0];

    const reviewData = {
      product_id: testProduct.id,
      user_id: testUser.id,
      rating: 5,
      title: 'Great Product!',
      body: 'This product exceeded my expectations. Highly recommended!'
    };

    try {
      const response = await fetch('http://localhost:3001/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        const newReview = await response.json();
        console.log('   ✓ Review created successfully');
        console.log(`   Review ID: ${newReview.id}`);
      } else {
        const errorData = await response.text();
        console.log(`   ✗ Failed to create review: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.log(`   ✗ Error creating review: ${error.message}`);
    }

    // Test 3: Get reviews again to verify the new review
    console.log('\n3. Verifying review was added...');
    try {
      const response = await fetch(`http://localhost:3001/api/reviews/${testProduct.id}`);
      if (response.ok) {
        const reviews = await response.json();
        console.log(`   ✓ Product now has ${reviews.length} reviews`);
        if (reviews.length > 0) {
          const latestReview = reviews[0];
          console.log(`   Latest review: "${latestReview.title}" by rating ${latestReview.rating}/5`);
        }
      } else {
        console.log(`   ✗ Failed to fetch reviews after creation: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ✗ Error fetching reviews after creation: ${error.message}`);
    }

    console.log('\nReviews system test completed!');

  } catch (error) {
    console.error('Error testing reviews system:', error);
  }
}

testReviewsSystem();