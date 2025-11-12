import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function main() {
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  
  // Get all products with images
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, slug, images, gallery_images')
    .not('images', 'is', null);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products.length} products with images\n`);

  for (const product of products) {
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

    // Update product with corrected URLs
    const { error: updateError } = await supabase
      .from('products')
      .update({
        images: fixedImages,
        gallery_images: fixedGallery
      })
      .eq('id', product.id);

    if (updateError) {
      console.error(`❌ Error updating ${product.title}:`, updateError);
    } else {
      console.log(`✓ Fixed ${product.title}`);
      if (fixedImages) console.log(`  Images: ${fixedImages.length} URLs updated`);
      if (fixedGallery) console.log(`  Gallery: ${fixedGallery.length} URLs updated`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
