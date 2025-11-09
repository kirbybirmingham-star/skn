import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import sharp from 'sharp';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample image URLs for each product
const SAMPLE_IMAGES = {
  'laptop': {
    main: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
    gallery: [
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085'
    ]
  },
  't-shirt': {
    main: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
    gallery: [
      'https://images.unsplash.com/photo-1562157873-818bc0726f68',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a'
    ]
  },
  'coffee-mug': {
    main: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38',
    gallery: [
      'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085'
    ]
  },
  'smartphone': {
    main: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd',
    gallery: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0'
    ]
  },
  'jeans': {
    main: 'https://images.unsplash.com/photo-1542272604-787c3835535d',
    gallery: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246',
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb'
    ]
  }
};

/**
 * Download an image from a URL and resize it
 */
async function downloadImage(url, options = { width: 800 }) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
  const buffer = await response.arrayBuffer();
  
  // Convert ArrayBuffer to Buffer
  const imageBuffer = Buffer.from(buffer);
  
  // Resize image
  const resized = await sharp(imageBuffer)
    .resize(options.width)
    .jpeg({ quality: 80 })
    .toBuffer();
  
  return resized;
}

/**
 * Upload image to Supabase storage
 */
async function uploadToStorage(buffer, path, contentType = 'image/jpeg') {
  const { data, error } = await supabase.storage
    .from('listing-images')
    .upload(path, buffer, {
      contentType,
      upsert: true
    });

  if (error) throw error;
  return data;
}

/**
 * Process a single product's images
 */
async function processProductImages(slug, images) {
  console.log(`\nProcessing images for product: ${slug}`);
  
  try {
    // Upload main image
    console.log('Downloading main image...');
    const mainBuffer = await downloadImage(images.main);
    console.log('Uploading main image...');
    await uploadToStorage(mainBuffer, `products/${slug}/main.jpg`);
    console.log('✓ Main image uploaded');

    // Upload gallery images
    console.log('Processing gallery images...');
    for (const [index, url] of images.gallery.entries()) {
      console.log(`Downloading gallery image ${index + 1}...`);
      const galleryBuffer = await downloadImage(url);
      console.log(`Uploading gallery image ${index + 1}...`);
      await uploadToStorage(galleryBuffer, `products/${slug}/gallery/image-${index + 1}.jpg`);
      console.log(`✓ Gallery image ${index + 1} uploaded`);
    }

    // Create thumbnail from main image
    console.log('Creating and uploading thumbnail...');
    const thumbnail = await sharp(mainBuffer)
      .resize(200)
      .jpeg({ quality: 80 })
      .toBuffer();
    await uploadToStorage(thumbnail, `products/${slug}/thumbnails/thumb.jpg`);
    console.log('✓ Thumbnail uploaded');

    // Update product record with image URLs
    try {
      console.log('Updating product record with image URLs...');
      const bucketName = 'listing-images';
      const mainImageUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/products/${slug}/main.jpg`;
      const galleryUrls = images.gallery.map((_, index) => 
        `${supabaseUrl}/storage/v1/object/public/${bucketName}/products/${slug}/gallery/image-${index + 1}.jpg`
      );

      const { data, error: updateError } = await supabase
        .from('products')
        .update({
          image_url: mainImageUrl
        })
        .eq('slug', slug)
        .select();

      if (updateError) {
        console.error('Error details:', updateError);
        throw updateError;
      }
      console.log('Product record updated:', data);
    } catch (error) {
      console.warn('Could not update product record:', error.message);
      console.warn('Continuing with next product...');
    }
    console.log('✓ Product record updated with image URLs');

  } catch (error) {
    console.error(`Error processing ${slug}:`, error.message);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('Starting sample image upload process...');

  for (const [slug, images] of Object.entries(SAMPLE_IMAGES)) {
    await processProductImages(slug, images);
  }

  console.log('\n✨ Image upload process completed!');
}

// Try to reload schema cache before running
async function reloadCache() {
  try {
    await supabase.rpc('reload_schema_cache');
    console.log('Schema cache reloaded successfully');
  } catch (err) {
    console.log('Note: Schema cache reload not available, continuing anyway...');
  }
}

// Run the script
reloadCache()
  .then(() => main())
  .catch(console.error);