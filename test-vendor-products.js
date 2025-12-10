import('dotenv').then(dotenv => dotenv.default.config());
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

(async () => {
  console.log('Checking vendor_products table:\n');
  
  // Get all from vendor_products
  const { data, error } = await supabase
    .from('vendor_products')
    .select('*')
    .order('base_price', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Total in vendor_products: ${data.length}\n`);
    data.slice(0, 10).forEach(p => {
      console.log(`${p.title || 'Unknown'} — ${p.base_price || 'null'} cents`);
    });
  }
})();
