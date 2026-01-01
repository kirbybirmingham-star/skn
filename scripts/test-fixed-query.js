import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test the FIXED query - simple products query only
const baseSelect = 'id, title, slug, vendor_id, base_price, currency, image_url, gallery_images, is_published, created_at';

console.log('Testing FIXED API query...\n');

const { data, error } = await supabase
  .from('products')
  .select(baseSelect)
  .order('created_at', { ascending: false })
  .limit(5);

if (error) {
  console.error('❌ Query Error:', error.message);
} else {
  console.log('✅ Query successful!');
  console.log('Got', data.length, 'products\n');
  
  // Show sample products
  data.forEach(p => {
    console.log(`✓ ${p.title}`);
    console.log(`  Price: ${p.base_price} ${p.currency}`);
    console.log(`  Published: ${p.is_published}`);
    console.log(`  Image URL: ${p.image_url ? '✓' : '✗'}`);
    console.log('');
  });
}


