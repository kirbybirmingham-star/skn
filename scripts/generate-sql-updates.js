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

  console.log('================================================================================');
  console.log('SQL UPDATE STATEMENTS TO FIX IMAGE URLS');
  console.log('================================================================================\n');
  console.log('INSTRUCTIONS:');
  console.log('1. Go to: https://app.supabase.com/project/ebvlniuzrttvvgilccui/sql/new');
  console.log('2. Click "New Query"');
  console.log('3. Copy and paste the SQL below');
  console.log('4. Click "Run"\n');
  console.log('================================================================================\n');

  const wrongUrl = 'https://supabase.co';
  const correctUrl = supabaseUrl;

  console.log('BEGIN TRANSACTION;\n');

  let updateCount = 0;
  
  for (const product of products) {
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

    if (!hasWrongUrl && product.gallery_images) {
      for (const img of product.gallery_images) {
        if (img && img.includes(wrongUrl)) {
          hasWrongUrl = true;
          break;
        }
      }
    }

    if (hasWrongUrl) {
      updateCount++;
      const fixedImages = product.images?.map(img => img?.replace(wrongUrl, correctUrl)) || null;
      const fixedGallery = product.gallery_images?.map(img => img?.replace(wrongUrl, correctUrl)) || null;

      console.log(`-- Update ${product.title} (ID: ${product.id})`);
      console.log(`UPDATE public.products`);
      console.log(`SET`);
      if (fixedImages) {
        console.log(`  images = ${JSON.stringify(fixedImages)}::text[],`);
      }
      if (fixedGallery) {
        console.log(`  gallery_images = ${JSON.stringify(fixedGallery)}::text[]`);
      }
      console.log(`WHERE id = '${product.id}';\n`);
    }
  }

  console.log('COMMIT TRANSACTION;\n');
  console.log('================================================================================');
  console.log(`Total updates: ${updateCount} products`);
  console.log('================================================================================\n');
}

main().catch(console.error);
