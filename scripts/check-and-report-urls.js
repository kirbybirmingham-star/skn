import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  
  // Get all products with images
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, slug, images, gallery_images');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products.length} products\n`);

  // Collect products that need updating
  const toUpdate = [];
  
  for (const product of products) {
    let needsUpdate = false;
    
    if (product.images && Array.isArray(product.images)) {
      for (const img of product.images) {
        if (img && img.includes('https://supabase.co/')) {
          needsUpdate = true;
          break;
        }
      }
    }
    
    if (product.gallery_images && Array.isArray(product.gallery_images)) {
      for (const img of product.gallery_images) {
        if (img && img.includes('https://supabase.co/')) {
          needsUpdate = true;
          break;
        }
      }
    }
    
    if (needsUpdate) {
      toUpdate.push(product);
    }
  }

  if (toUpdate.length === 0) {
    console.log('✓ All images already have correct URLs!');
    return;
  }

  console.log(`${toUpdate.length} products need URL fixes\n`);

  for (const product of toUpdate) {
    const wrongUrl = 'https://supabase.co';
    const correctUrl = supabaseUrl;
    
    // Fix images array
    const fixedImages = product.images?.map(img => 
      img.replace(wrongUrl, correctUrl)
    );
    
    // Fix gallery_images array
    const fixedGallery = product.gallery_images?.map(img => 
      img.replace(wrongUrl, correctUrl)
    );

    console.log(`Fixing ${product.title}...`);
    
    // Try to update - this will likely fail due to RLS, but let's try
    const { error: updateError } = await supabase
      .from('products')
      .update({
        images: fixedImages,
        gallery_images: fixedGallery
      })
      .eq('id', product.id);

    if (updateError) {
      console.log(`  ⚠️  Cannot update via anon key (${updateError.message})`);
      console.log(`  To fix, you need to:`);
      console.log(`    1. Go to Supabase Dashboard`);
      console.log(`    2. Open SQL Editor`);
      console.log(`    3. Run the SQL below:`);
      console.log(`\n${generateSQL(product.id, fixedImages, fixedGallery)}\n`);
    } else {
      console.log(`  ✓ Updated`);
    }
  }

  console.log('Done!');
}

function generateSQL(productId, images, gallery) {
  return `UPDATE public.products SET images = '${JSON.stringify(images)}'::text[], gallery_images = '${JSON.stringify(gallery)}'::text[] WHERE id = '${productId}';`;
}

main().catch(console.error);
