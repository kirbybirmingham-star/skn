import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'listings-images';

// Simple image search using Pexels API (free, no auth required for basic search)
async function searchImage(productName) {
  try {
    // Using Unsplash Source - simple URL-based image fetching (no API key needed)
    // Format: https://source.unsplash.com/400x300/?{search-term}
    
    // Clean up product name for search
    const searchTerm = productName
      .replace(/-/g, ' ')
      .replace(/blend|powder|loaf|necklace|dress|dreamer|cooler|smoothie|seasoning|tracker|speaker|tracker|beans|sauce|honey|bread|coffee|pasta|ginger|mango|passion|pineapple|wireless|mouse|keyboard|monitor|headphones|bank|power|fitness|bluetooth|charger|cable/gi, '')
      .trim();

    console.log(`  🔍 Search term: "${searchTerm || productName}"`);
    
    // Unsplash Source API
    const imageUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(searchTerm || productName)}`;
    console.log(`  📥 Downloading from: ${imageUrl}`);
    
    return imageUrl;
  } catch (err) {
    console.error(`  ❌ Error creating URL: ${err.message}`);
    return null;
  }
}

async function downloadImage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.buffer();
    return buffer;
  } catch (err) {
    console.error(`  ❌ Download failed: ${err.message}`);
    return null;
  }
}

async function optimizeImage(buffer) {
  try {
    // Optimize with sharp - reduce to 2MB max
    const optimized = await sharp(buffer)
      .resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    return optimized;
  } catch (err) {
    console.error(`  ⚠️  Optimization failed: ${err.message}, using original`);
    return buffer;
  }
}

async function uploadImage(bucket, path, buffer, productSlug) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { upsert: true, contentType: 'image/jpeg' });

    if (error) throw error;

    // Generate public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data?.publicUrl || null;
  } catch (err) {
    console.error(`  ❌ Upload failed: ${err.message}`);
    return null;
  }
}

async function populateMissingImages() {
  console.log('🖼️  Populating missing product images from Google Images\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Get products with external URLs
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, slug, image_url, vendor_id')
      .not('image_url', 'is', null)
      .order('title');

    if (error) throw error;

    // Get bucket images
    const { data: bucketItems } = await supabase.storage
      .from(BUCKET)
      .list('', { recursive: true });

    const bucketImages = new Set(
      bucketItems
        .map(item => item.name)
        .filter(name => !name.includes('/'))
        .map(name => name.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '').toLowerCase())
    );

    // Find products to populate (those with external URLs)
    const toPopulate = products.filter(p => !bucketImages.has(p.slug.toLowerCase()));

    console.log(`📊 Total products: ${products.length}`);
    console.log(`✅ Already in bucket: ${bucketImages.size}`);
    console.log(`⏳ To populate: ${toPopulate.length}\n`);

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < toPopulate.length; i++) {
      const product = toPopulate[i];
      console.log(`\n[${i + 1}/${toPopulate.length}] ${product.slug}`);
      console.log(`   Title: ${product.title}`);

      // Search for image
      const imageUrl = await searchImage(product.title);
      if (!imageUrl) {
        failed++;
        continue;
      }

      // Download
      const buffer = await downloadImage(imageUrl);
      if (!buffer) {
        failed++;
        continue;
      }

      console.log(`   ✓ Downloaded (${(buffer.length / 1024).toFixed(1)}KB)`);

      // Optimize
      const optimized = await optimizeImage(buffer);
      console.log(`   ✓ Optimized (${(optimized.length / 1024).toFixed(1)}KB)`);

      // Upload to bucket
      const storagePath = `${product.slug}.jpg`;
      const publicUrl = await uploadImage(BUCKET, storagePath, optimized, product.slug);

      if (!publicUrl) {
        failed++;
        continue;
      }

      console.log(`   ✓ Uploaded`);

      // Update product record
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', product.id);

      if (updateError) {
        console.log(`   ⚠️  DB update failed: ${updateError.message}`);
        failed++;
      } else {
        console.log(`   ✓ Database updated`);
        succeeded++;
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n${'═'.repeat(55)}`);
    console.log(`\n📊 Results:`);
    console.log(`  ✅ Succeeded: ${succeeded}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📸 Total in bucket now: ${bucketImages.size + succeeded}\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

populateMissingImages();
