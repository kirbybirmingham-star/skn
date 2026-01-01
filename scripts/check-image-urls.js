import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars. Aborting.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImageURLs() {
  console.log('Checking actual image URLs in products table...\n');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, slug, image_url, gallery_images')
    .limit(10);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log('First 10 products with image URLs:');
  products.forEach(product => {
    console.log(`${product.title}:`);
    console.log(`  Image URL: ${product.image_url || 'null'}`);
    console.log(`  Gallery: ${JSON.stringify(product.gallery_images) || 'null'}`);
    console.log('');
  });

  // Check specific failing products
  const failingProducts = [
    'dried-mango-slices',
    'tamarind-ginger-tea',
    'palm-leaf-print-hat',
    'recycled-glass-wind-chimes',
    'embroidered-beach-cover-up',
    'guava-paradise-bowl'
  ];

  console.log('Checking failing product URLs:');
  for (const slug of failingProducts) {
    const product = products.find(p => p.slug === slug);
    if (product) {
      console.log(`${product.title}:`);
      console.log(`  URL: ${product.image_url}`);

      if (product.image_url) {
        try {
          const response = await fetch(product.image_url, { method: 'HEAD' });
          console.log(`  Status: ${response.status} ${response.statusText}`);
        } catch (err) {
          console.error(`  Error: ${err.message}`);
        }
      }
      console.log('');
    }
  }
}

checkImageURLs().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});