import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
  const productId = '8efbfdc7-287f-4ad6-a677-a0ca3f2240fa';
  
  console.log('\n=== Test 1: Basic product query ===');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();
    
    if (error) {
      console.error('ERROR:', error.message);
      console.error('Code:', error.code);
    } else {
      console.log('SUCCESS');
      console.log('Product:', data?.title);
    }
  } catch (e) {
    console.error('EXCEPTION:', e.message);
  }

  console.log('\n=== Test 2: With product_variants(*) ===');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('id', productId)
      .maybeSingle();
    
    if (error) {
      console.error('ERROR:', error.message);
      console.error('Code:', error.code);
    } else {
      console.log('SUCCESS');
      console.log('Product:', data?.title);
      console.log('Variants:', data?.product_variants?.length || 0);
    }
  } catch (e) {
    console.error('EXCEPTION:', e.message);
  }

  console.log('\n=== Test 3: With product_variants(id, name, images) ===');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(id, name, images)')
      .eq('id', productId)
      .maybeSingle();
    
    if (error) {
      console.error('ERROR:', error.message);
      console.error('Code:', error.code);
    } else {
      console.log('SUCCESS');
      console.log('Product:', data?.title);
      console.log('Variants:', data?.product_variants?.length || 0);
    }
  } catch (e) {
    console.error('EXCEPTION:', e.message);
  }

  console.log('\n=== Test 4: With product_ratings(*) ===');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_ratings(*)')
      .eq('id', productId)
      .maybeSingle();
    
    if (error) {
      console.error('ERROR:', error.message);
      console.error('Code:', error.code);
    } else {
      console.log('SUCCESS');
      console.log('Product:', data?.title);
      console.log('Ratings:', data?.product_ratings?.length || 0);
    }
  } catch (e) {
    console.error('EXCEPTION:', e.message);
  }
}

testQuery();
