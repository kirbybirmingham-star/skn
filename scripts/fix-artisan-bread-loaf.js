import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { getProductMainImagePath, getPublicUrl } from '../src/lib/storagePathBuilder.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'listings-images';
const supabaseUrl = process.env.VITE_SUPABASE_URL;

// Pexels has a free image search API (no auth required for basic use via CDN)
// We'll use Picsum Photos which is more reliable than Unsplash Source
async function fetchFromPicsumPhotos(term) {
  try {
    // Picsum allows random images: https://picsum.photos/{width}/{height}/?{query}
    const url = `https://picsum.photos/800/600?random=${Date.now()}`;
    const res = await fetch(url, { redirect: 'follow', timeout: 15000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.arrayBuffer();
  } catch (err) {
    console.error(`Picsum fetch failed: ${err.message}`);
    return null;
  }
}

async function run() {
  console.log('🍞 Fetching real image for artisan-bread-loaf\n');

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', 'artisan-bread-loaf')
    .single();

  if (error || !product) {
    console.error('Product not found');
    process.exit(1);
  }

  console.log(`📦 ${product.title}`);
  console.log(`   Current: ${product.image_url.substring(0, 80)}...\n`);

  // Fetch image
  console.log('📥 Fetching from Picsum Photos...');
  const ab = await fetchFromPicsumPhotos('bread');
  if (!ab) {
    console.error('Failed to fetch image');
    process.exit(1);
  }

  const buffer = Buffer.from(ab);
  console.log(`✓ Downloaded (${(buffer.length / 1024).toFixed(1)}KB)`);

  // Optimize
  try {
    const optimized = await sharp(buffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
    console.log(`✓ Optimized (${(optimized.length / 1024).toFixed(1)}KB)`);

    // Upload
    const newPath = getProductMainImagePath(product.vendor_id, product.slug);
    console.log(`📤 Uploading to: ${newPath}`);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(newPath, optimized, { upsert: true, contentType: 'image/jpeg' });

    if (uploadError) {
      console.error('Upload failed:', uploadError.message);
      process.exit(1);
    }

    console.log('✓ Uploaded');

    // Update DB
    const publicUrl = getPublicUrl(supabaseUrl, BUCKET, newPath);
    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: publicUrl })
      .eq('id', product.id);

    if (updateError) {
      console.error('DB update failed:', updateError.message);
      process.exit(1);
    }

    console.log('✓ DB updated');
    console.log(`\n✅ Image replaced successfully!`);
    console.log(`   New URL: ${publicUrl}\n`);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
