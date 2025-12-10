import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import sharp from 'sharp';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration for this run
const BUCKET = 'skn-bridge-assets';
const PRODUCT_SLUG = 'island-curry-powder-blend';
// Direct image URL for the spices photo from Unsplash (three spoons filled with different types of spices)
const IMAGE_URL = 'https://unsplash.com/photos/eFwOKxmByEc/download?force=true';

async function downloadImage(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Failed to download image: ${res.status} ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function resizeToJpeg(buffer, width = 1200) {
  let result = await sharp(buffer).resize(width).jpeg({ quality: 85 }).toBuffer();
  
  // If over 1 MB, reduce quality and/or width
  const MAX_SIZE = 1024 * 1024; // 1 MB
  if (result.length > MAX_SIZE) {
    console.log(`Image size ${(result.length / 1024).toFixed(1)} KB exceeds 1 MB limit, reducing quality...`);
    result = await sharp(buffer).resize(width).jpeg({ quality: 70 }).toBuffer();
  }
  if (result.length > MAX_SIZE) {
    console.log(`Still over 1 MB (${(result.length / 1024).toFixed(1)} KB), reducing width to 1000px...`);
    result = await sharp(buffer).resize(1000).jpeg({ quality: 70 }).toBuffer();
  }
  if (result.length > MAX_SIZE) {
    console.log(`Still over 1 MB (${(result.length / 1024).toFixed(1)} KB), reducing to quality 60...`);
    result = await sharp(buffer).resize(1000).jpeg({ quality: 60 }).toBuffer();
  }
  
  console.log(`Final image size: ${(result.length / 1024).toFixed(1)} KB`);
  return result;
}

async function uploadBuffer(buffer, path) {
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: 'image/jpeg',
    upsert: true
  });
  if (error) throw error;
  return data;
}

async function run() {
  try {
    console.log('Downloading image...');
    const raw = await downloadImage(IMAGE_URL);
    const mainBuf = await resizeToJpeg(raw, 1200);
    console.log('Uploading main image to storage...');
    const mainPath = `products/produce/${PRODUCT_SLUG}.jpg`;
    await uploadBuffer(mainBuf, mainPath);
    console.log(`Uploaded to ${BUCKET}/${mainPath}`);

    const publicMainUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${mainPath}`;
    console.log('Public main URL:', publicMainUrl);

    console.log('Updating product record image_url...');
    const { data, error } = await supabase
      .from('products')
      .update({ image_url: publicMainUrl })
      .eq('slug', PRODUCT_SLUG)
      .select();

    if (error) {
      console.error('Failed to update product record:', error);
      process.exit(1);
    }

    console.log('Product updated:', data);
    console.log('Done. You can verify with `node scripts/call-getProducts.js` or by checking the product in the frontend.');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

run();
