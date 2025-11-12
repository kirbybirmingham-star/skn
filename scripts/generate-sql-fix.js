import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, images, gallery_images');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('='.repeat(80));
  console.log('SQL COMMANDS TO FIX IMAGE URLS');
  console.log('='.repeat(80));
  console.log('\n1. Copy the SQL below');
  console.log('2. Go to: https://app.supabase.com/project/ebvlniuzrttvvgilccui/sql/');
  console.log('3. Click "New Query"');
  console.log('4. Paste the SQL');
  console.log('5. Click "Run"\n');
  console.log('='.repeat(80));
  console.log('BEGIN;\n');

  for (const product of products) {
    const wrongUrl = 'https://supabase.co';
    const correctUrl = supabaseUrl;
    
    let hasWrongUrl = false;
    
    // Check if any images have wrong URL
    if (product.images) {
      for (const img of product.images) {
        if (img && img.includes(wrongUrl)) {
          hasWrongUrl = true;
          break;
        }
      }
    }
    
    if (product.gallery_images) {
      for (const img of product.gallery_images) {
        if (img && img.includes(wrongUrl)) {
          hasWrongUrl = true;
          break;
        }
      }
    }
    
    if (hasWrongUrl) {
      const fixedImages = product.images?.map(img => img.replace(wrongUrl, correctUrl));
      const fixedGallery = product.gallery_images?.map(img => img.replace(wrongUrl, correctUrl));
      
      console.log(`-- Update ${product.title}`);
      console.log(`UPDATE public.products SET`);
      console.log(`  images = '${JSON.stringify(fixedImages)}'::jsonb,`);
      console.log(`  gallery_images = '${JSON.stringify(fixedGallery)}'::jsonb`);
      console.log(`WHERE id = '${product.id}';\n`);
    }
  }

  console.log('COMMIT;\n');
  console.log('='.repeat(80));
}

main().catch(console.error);
