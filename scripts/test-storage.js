import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

const testStorageAccess = async () => {
  console.log('Testing storage access...\n');

  // Test listings-images bucket access
  console.log('Testing listings-images bucket:');
  try {
    const { data: productsList, error: productsError } = await supabase.storage
      .from('listings-images')
      .list('products');
    
    if (productsError) throw productsError;
    console.log('✓ Can access products folder');
    console.log('Found items:', productsList.length);
  } catch (error) {
    console.error('✗ Error accessing products folder:', error.message);
  }

  // Test avatar bucket access
  console.log('\nTesting avatar bucket:');
  try {
    const { data: usersList, error: usersError } = await supabase.storage
      .from('avatar')
      .list('users');
    
    if (usersError) throw usersError;
    console.log('✓ Can access users folder');
    console.log('Found items:', usersList.length);
  } catch (error) {
    console.error('✗ Error accessing users folder:', error.message);
  }

  // Test URL generation
  console.log('\nTesting URL generation:');
  const testPaths = {
    'Product main image': {
      bucket: 'listings-images',
      path: 'products/test-product/main.jpg'
    },
    'Product thumbnail': {
      bucket: 'listings-images',
      path: 'products/test-product/thumbnails/thumb.jpg'
    },
    'Product gallery': {
      bucket: 'listings-images',
      path: 'products/test-product/gallery/1.jpg'
    },
    'User avatar': {
      bucket: 'avatar',
      path: 'users/test-user/medium.jpg'
    }
  };

  for (const [name, { bucket, path }] of Object.entries(testPaths)) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    console.log(`${name}:`);
    console.log(`✓ URL generated: ${data.publicUrl}\n`);
  }
};

// Run the test
testStorageAccess().catch(console.error);