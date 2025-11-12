import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, slug, images')
    .limit(3);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Products with image URLs:');
  products.forEach(p => {
    console.log(`\n${p.title} (${p.slug}):`);
    console.log('  Images:', p.images);
    console.log('  Valid URL?', p.images?.[0]?.includes('https://'));
  });

  // Try to fetch one image to see if it's accessible
  if (products[0]?.images?.[0]) {
    const imageUrl = products[0].images[0];
    console.log(`\nTesting image URL: ${imageUrl}`);
    try {
      const response = await fetch(imageUrl);
      console.log(`  Status: ${response.status}`);
      console.log(`  Content-Type: ${response.headers.get('content-type')}`);
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  }
}

main().catch(console.error);
