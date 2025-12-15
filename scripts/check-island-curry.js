import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkIslandCurry() {
  console.log('🔍 Checking Island Curry Powder Blend\n');

  try {
    // Get product
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('slug', 'island-curry-powder-blend')
      .single();

    console.log('📦 Product:', product.title);
    console.log('   Slug:', product.slug);
    console.log('   Vendor ID:', product.vendor_id);
    console.log('   Current image_url:', product.image_url.substring(0, 80) + '...');
    console.log('   Gallery images:', product.gallery_images);

    // Check vendor folder
    const vendorPath = `vendors/${product.vendor_id}/products/${product.slug}`;
    console.log(`\n📁 Checking vendor folder: ${vendorPath}`);

    const { data: files, error } = await supabase.storage
      .from('listings-images')
      .list(vendorPath);

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return;
    }

    if (!files || files.length === 0) {
      console.log('   ❌ No files found in vendor folder');
      console.log('   💡 This product needs its real image migrated from skn-bridge-assets');
      
      // Show the real image URL
      if (product.gallery_images && product.gallery_images.length > 0) {
        console.log(`\n   Real image available at:`);
        console.log(`   ${product.gallery_images[0]}`);
      }
    } else {
      console.log(`   ✅ Found ${files.length} files:`);
      files.forEach(f => {
        console.log(`      - ${f.name}`);
      });
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkIslandCurry();
