import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findMissingImages() {
  console.log('🔍 Finding products without images in listings-images...\n');

  try {
    // Get all products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, slug, image_url, vendor_id')
      .order('title');

    if (error) throw error;

    // Get list of images in bucket
    const { data: bucketItems } = await supabase.storage
      .from('listings-images')
      .list('', { recursive: true });

    // Extract image names
    const imageNames = bucketItems
      .map(item => item.name)
      .filter(name => !name.endsWith('/') && !name.includes('/'))
      .map(name => name.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '').toLowerCase());

    console.log(`📊 Products: ${products.length}`);
    console.log(`📸 Images in bucket: ${imageNames.length}\n`);

    // Find missing images
    const missingImages = [];
    const withBucketImages = [];
    const withExternalUrls = [];

    products.forEach(product => {
      const slugMatch = imageNames.includes(product.slug.toLowerCase());
      
      if (slugMatch) {
        withBucketImages.push(product);
      } else if (product.image_url && product.image_url.includes('http')) {
        withExternalUrls.push(product);
      } else {
        missingImages.push(product);
      }
    });

    console.log(`✅ With images in listings-images: ${withBucketImages.length}`);
    withBucketImages.forEach(p => console.log(`   - ${p.slug}`));

    console.log(`\n🌐 With external URLs (skn-bridge-assets): ${withExternalUrls.length}`);
    withExternalUrls.slice(0, 5).forEach(p => console.log(`   - ${p.slug}`));
    if (withExternalUrls.length > 5) console.log(`   ... and ${withExternalUrls.length - 5} more`);

    console.log(`\n❌ MISSING IMAGES (${missingImages.length}):`);
    missingImages.forEach(p => console.log(`   - ${p.slug} (${p.title})`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

findMissingImages();
