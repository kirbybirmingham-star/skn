import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listAllProducts() {
  try {
    console.log('Fetching all products...');

    // Query the 'products' table for all records
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, base_price');

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    if (products && products.length > 0) {
      console.log(`Found ${products.length} products:`);
      // Log each product's details
      products.forEach(product => {
        console.log(`- ID: ${product.id}, Title: ${product.title}, Price: ${product.base_price}`);
      });
    } else {
      console.log('No products found.');
    }
  } catch (err) {
    console.error('An unexpected error occurred:', err);
  }
}

listAllProducts();