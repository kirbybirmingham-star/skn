import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase
  .from('products')
  .select('*')
  .not('image_url', 'is', null)
  .limit(3);

data.forEach(p => {
  console.log(`Product: ${p.title}`);
  console.log(`  Vendor: ${p.vendor_id}`);
  console.log(`  Image URL: ${p.image_url}`);
  console.log(`  Gallery Images: ${JSON.stringify(p.gallery_images)}`);
  console.log('');
});
