import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRatings() {
  console.log('=== DEBUG: TESTING RATINGS QUERIES ===\n');

  // Get the product that has a rating
  const productId = '0d39966f-d67f-4e45-94d5-81f10d48bbc4';

  console.log(`Testing with product ID: ${productId}\n`);

  // Test 1: Direct product_ratings query
  console.log('1. Direct query from product_ratings table:');
  const { data: direct, error: e1 } = await supabase
    .from('product_ratings')
    .select('*')
    .eq('product_id', productId);

  if (e1) {
    console.error('  ❌ Error:', e1.message);
  } else {
    console.log(`  ✓ Found ${direct.length} ratings`);
    if (direct.length > 0) {
      console.log(`    Fields: ${Object.keys(direct[0]).join(', ')}`);
      console.log(`    First rating: ${JSON.stringify(direct[0], null, 2)}`);
    }
  }

  // Test 2: Relationship from products
  console.log('\n2. Relationship query from products table:');
  const { data: rel, error: e2 } = await supabase
    .from('products')
    .select('id, product_ratings(*)')
    .eq('id', productId);

  if (e2) {
    console.error('  ❌ Error:', e2.message);
  } else {
    console.log(`  ✓ Found ${rel.length} products`);
    if (rel.length > 0 && rel[0].product_ratings) {
      console.log(`    Product ratings count: ${rel[0].product_ratings.length}`);
      if (rel[0].product_ratings.length > 0) {
        console.log(`    First rating: ${JSON.stringify(rel[0].product_ratings[0], null, 2)}`);
      }
    }
  }

  // Test 3: With selected fields only
  console.log('\n3. Relationship with selected fields:');
  const { data: sel, error: e3 } = await supabase
    .from('products')
    .select('id, product_ratings(product_id, rating)')
    .eq('id', productId);

  if (e3) {
    console.error('  ❌ Error:', e3.message);
  } else {
    console.log(`  ✓ Found ${sel.length} products`);
    if (sel.length > 0 && sel[0].product_ratings) {
      console.log(`    Product ratings count: ${sel[0].product_ratings.length}`);
      if (sel[0].product_ratings.length > 0) {
        console.log(`    Data: ${JSON.stringify(sel[0].product_ratings[0])}`);
      }
    }
  }

  console.log('\n=== END DEBUG ===');
}

debugRatings().catch(console.error);
