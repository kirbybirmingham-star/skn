/**
 * Verify product data after migration
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  console.log('✅ Verifying product data after image migration\n');
  
  // Check products with is_published = true
  const { data, error } = await supabase
    .from('products')
    .select('id, title, image_url, gallery_images, is_published')
    .eq('is_published', true)
    .limit(15);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📦 Found ${data.length} published products\n`);
  
  let withImages = 0;
  let missingImages = 0;
  
  data.forEach((p, i) => {
    const hasImage = !!p.image_url && p.image_url.trim().length > 0;
    const hasGallery = (p.gallery_images?.length || 0) > 0;
    
    if (hasImage) withImages++;
    if (!hasImage) missingImages++;
    
    const status = hasImage ? '✓' : '✗';
    console.log(`${i + 1}. [${status}] ${p.title}`);
    if (p.image_url) {
      const shortUrl = p.image_url.includes('/public/') 
        ? p.image_url.split('/public/')[1].substring(0, 50) + '...'
        : p.image_url.substring(0, 50) + '...';
      console.log(`     ${shortUrl}`);
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`  ✓ Products with image_url: ${withImages}/${data.length}`);
  console.log(`  ✗ Products missing images: ${missingImages}/${data.length}`);
  
  // Check all products (including unpublished)
  const { data: all } = await supabase
    .from('products')
    .select('id, is_published')
    .limit(1000);
  
  const published = all.filter(p => p.is_published).length;
  const unpublished = all.filter(p => !p.is_published).length;
  
  console.log(`\n📈 Total Products:`);
  console.log(`  Published: ${published}`);
  console.log(`  Unpublished: ${unpublished}`);
}

verify().catch(console.error);
