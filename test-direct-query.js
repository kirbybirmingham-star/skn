import('dotenv').then(dotenv => dotenv.default.config());
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'placeholder'
);

(async () => {
  console.log('Direct Supabase query test:\n');
  
  // Test direct query for under-50 (< 5000 cents)
  console.log('--- Direct query: base_price <= 5000');
  const result1 = await supabase
    .from('products')
    .select('id, title, base_price')
    .lte('base_price', 5000)
    .limit(10);
  
  if (result1.error) {
    console.error('Error:', result1.error);
  } else {
    console.log(`Found ${result1.data.length} items:`);
    result1.data.forEach(p => {
      console.log(`  ${p.title} — ${p.base_price} cents`);
    });
  }
  
  // Test direct query for 50-200 (5000-20000 cents)
  console.log('\n--- Direct query: base_price >= 5000 AND base_price <= 20000');
  const result2 = await supabase
    .from('products')
    .select('id, title, base_price')
    .gte('base_price', 5000)
    .lte('base_price', 20000)
    .limit(10);
  
  if (result2.error) {
    console.error('Error:', result2.error);
  } else {
    console.log(`Found ${result2.data.length} items:`);
    result2.data.forEach(p => {
      console.log(`  ${p.title} — ${p.base_price} cents`);
    });
  }
  
  // Get all products to see the actual range
  console.log('\n--- All products and their prices');
  const allResult = await supabase
    .from('products')
    .select('id, title, base_price')
    .order('base_price', { ascending: false });
  
  if (allResult.error) {
    console.error('Error:', allResult.error);
  } else {
    console.log(`Found ${allResult.data.length} items total`);
    const minPrice = Math.min(...allResult.data.map(p => p.base_price || 0));
    const maxPrice = Math.max(...allResult.data.map(p => p.base_price || 0));
    console.log(`Price range: ${minPrice} - ${maxPrice} cents`);
  }
})();
