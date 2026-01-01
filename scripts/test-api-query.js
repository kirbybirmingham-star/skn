import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test the exact query from the API
const baseSelect = 'id, title, slug, vendor_id, base_price, currency, image_url, gallery_images, is_published, ribbon_text, created_at';

console.log('Testing API query...\n');

const { data, error } = await supabase
  .from('products')
  .select(`${baseSelect}, product_variants(id,name,images,price_in_cents,price_formatted), product_ratings(*)`)
  .order('created_at', { ascending: false })
  .limit(5);

if (error) {
  console.error('❌ Query Error:', error.message);
  console.error('Details:', error);
  
  // Try without variants to see if that's the issue
  console.log('\n\nTrying query WITHOUT variants...');
  const { data: data2, error: error2 } = await supabase
    .from('products')
    .select(baseSelect)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error2) {
    console.error('Still fails:', error2.message);
  } else {
    console.log('✅ Query works without variants!');
    console.log('Problem is in the product_variants relation');
  }
} else {
  console.log('✅ Query successful!');
  console.log('Got', data.length, 'products');
  console.log('\nSample product:');
  console.log(JSON.stringify(data[0], null, 2).substring(0, 300));
}
