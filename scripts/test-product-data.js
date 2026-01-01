/**
 * Test: Verify product data is loading correctly
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log('🧪 Testing product data...\n');
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, image_url, gallery_images')
    .eq('is_published', true)
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`✅ Loaded ${products.length} products\n`);
  
  products.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title}`);
    console.log(`   image_url: ${p.image_url ? '✓' : '✗'}`);
    console.log(`   gallery: ${p.gallery_images?.length || 0} images`);
    if (p.image_url) {
      const bucket = p.image_url.includes('/public/') ? p.image_url.split('/public/')[1].split('/')[0] : 'unknown';
      console.log(`   bucket: ${bucket}`);
    }
  });
  
  // Test API response
  console.log('\n🔍 Testing API response...\n');
  
  const { default: EcommerceApi } = await import('./src/api/EcommerceApi.jsx');
  const apiProducts = await EcommerceApi.getProducts();
  
  console.log(`API returned ${apiProducts.products.length} products`);
  console.log(`First product:`, {
    title: apiProducts.products[0]?.title,
    image_url: apiProducts.products[0]?.image_url ? '✓' : '✗',
    gallery_images: apiProducts.products[0]?.gallery_images?.length || 0
  });
}

test().catch(console.error);
