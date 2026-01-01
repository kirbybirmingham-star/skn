import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get actual variant structure
const { data, error } = await supabase
  .from('product_variants')
  .select('*')
  .limit(1);

if (error) {
  console.error('Error:', error.message);
} else {
  console.log('✅ Actual product_variants columns:');
  console.log(Object.keys(data[0] || {}));
  console.log('\nSample variant:');
  console.log(JSON.stringify(data[0], null, 2));
}
