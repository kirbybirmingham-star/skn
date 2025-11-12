import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, slug, image_url, gallery_images, base_price')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Products:');
  console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error);
