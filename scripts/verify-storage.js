import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data for testing
const TEST_DATA = {
  product: {
    slug: 'test-product',
    images: [
      { type: 'main', file: 'main.jpg' },
      { type: 'gallery', file: 'gallery1.jpg' },
      { type: 'thumbnail', file: 'thumb.jpg' }
    ]
  },
  user: {
    id: 'test-user',
    avatar: 'avatar.jpg'
  },
  vendor: {
    slug: 'test-vendor',
    images: [
      { type: 'logo', file: 'logo.png' },
      { type: 'banner', file: 'banner.jpg' }
    ]
  }
};

// Test functions
const verifyProductPaths = async () => {
  const { slug, images } = TEST_DATA.product;
  
  for (const image of images) {
    // Construct the path based on our folder structure
    const path = image.type === 'main' 
      ? `products/${slug}/${image.file}`
      : image.type === 'gallery'
      ? `products/${slug}/gallery/${image.file}`
      : `products/${slug}/thumbnails/${image.file}`;

    // Try to list the parent folder
    const parentPath = path.split('/').slice(0, -1).join('/');
    const { data, error } = await supabase.storage
      .from('listings-images')
      .list(parentPath);

    console.log(`Testing product ${image.type} image path: ${path}`);
    console.log(`Folder access: ${error ? '❌ Failed' : '✅ Success'}`);
    if (data) console.log(`Found ${data.length} items in folder`);
    console.log('---');
  }
};

const verifyAvatarPaths = async () => {
  const { id, avatar } = TEST_DATA.user;
  const path = `users/${id}/${avatar}`;
  
  // Try to list the parent folder
  const parentPath = path.split('/').slice(0, -1).join('/');
  const { data, error } = await supabase.storage
    .from('avatar')
    .list(parentPath);

  console.log(`Testing user avatar path: ${path}`);
  console.log(`Folder access: ${error ? '❌ Failed' : '✅ Success'}`);
  if (data) console.log(`Found ${data.length} items in folder`);
  console.log('---');
};

const verifyVendorPaths = async () => {
  const { slug, images } = TEST_DATA.vendor;
  
  for (const image of images) {
    const path = `vendors/${slug}/${image.file}`;
    
    // Try to list the parent folder
    const parentPath = path.split('/').slice(0, -1).join('/');
    const { data, error } = await supabase.storage
      .from('listings-images')
      .list(parentPath);

    console.log(`Testing vendor ${image.type} path: ${path}`);
    console.log(`Folder access: ${error ? '❌ Failed' : '✅ Success'}`);
    if (data) console.log(`Found ${data.length} items in folder`);
    console.log('---');
  }
};

// Run all tests
console.log('🔍 Verifying storage paths and permissions...\n');

Promise.all([
  verifyProductPaths(),
  verifyAvatarPaths(),
  verifyVendorPaths()
]).then(() => {
  console.log('✨ Storage verification complete!');
}).catch(error => {
  console.error('❌ Error during verification:', error);
});