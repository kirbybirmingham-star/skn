/**
 * Client-side debug utility - run in browser console
 * Logs product data being rendered and storage information
 */

window.debugProducts = async function() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 PRODUCT CARD DATA VERIFICATION (Client-Side)');
  console.log('='.repeat(80) + '\n');

  // Import the API functions from the app's context
  const { supabase } = window.__APP_STATE__ || {};
  
  if (!supabase) {
    console.error('❌ Supabase not available in window context');
    console.log('💡 Try running this after the marketplace page loads');
    return;
  }

  try {
    // Get products from the API
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, base_price, currency, image_url, gallery_images, is_published')
      .limit(10);

    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }

    console.log(`✅ Fetched ${products?.length || 0} products\n`);

    if (products && products.length > 0) {
      console.log('📋 PRODUCT DATA:');
      console.table(products.map(p => ({
        title: p.title,
        price: p.base_price,
        currency: p.currency,
        hasImage: !!p.image_url,
        imageUrl: p.image_url ? p.image_url.substring(0, 50) + '...' : 'NONE',
        published: p.is_published
      })));
    }

    // Check storage
    console.log('\n💾 CHECKING STORAGE...');
    
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.warn('⚠️  Could not list buckets:', bucketsError);
    } else {
      console.log(`✅ Storage buckets: ${buckets.map(b => b.name).join(', ')}`);
    }

    const { data: files, error: filesError } = await supabase
      .storage
      .from('product-images')
      .list('', { limit: 20 });

    if (filesError) {
      console.warn('⚠️  Could not list files:', filesError);
    } else {
      console.log(`✅ Files in product-images: ${files?.length || 0}`);
      if (files && files.length > 0) {
        console.log('Sample files:', files.slice(0, 5).map(f => f.name));
      }
    }

  } catch (err) {
    console.error('❌ Error:', err);
  }

  console.log('\n' + '='.repeat(80) + '\n');
};

// Also log what ProductsList is rendering
window.logProductsState = function() {
  console.log('\n🎯 Check React DevTools to see ProductsList state');
  console.log('Or look at the network tab to see what getProducts() returned');
};

console.log('✅ Debug utilities loaded:');
console.log('  - window.debugProducts() : Fetch and display product data');
console.log('  - window.logProductsState() : Show where to check state');
