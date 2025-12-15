#!/usr/bin/env node
/**
 * Populate product images from Unsplash API
 * 
 * This script:
 * 1. Queries all products from the database
 * 2. Identifies products missing images
 * 3. Downloads royalty-free images from Unsplash using product names as search queries
 * 4. Uploads images to Supabase storage (product-images bucket)
 * 5. Updates product records with image URLs
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Unsplash API key (free tier: 50 requests/hour)
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_* variants)');
  process.exit(1);
}

if (!UNSPLASH_ACCESS_KEY) {
  console.warn('⚠️  UNSPLASH_ACCESS_KEY not set. Get one free at: https://unsplash.com/oauth/applications');
  console.warn('   Without it, images will not be downloaded.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper: download file from URL
async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, response => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(dest);
        });
      })
      .on('error', err => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

// Helper: search Unsplash and get download URL
async function searchUnsplash(query) {
  if (!UNSPLASH_ACCESS_KEY) return null;

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1&orientation=landscape`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`⚠️  Unsplash API error for "${query}": ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      console.log(`   No results for "${query}"`);
      return null;
    }

    const photo = data.results[0];
    return {
      url: photo.urls.regular,
      downloadUrl: photo.links.download_location,
      photographer: photo.user.name,
      photoId: photo.id
    };
  } catch (err) {
    console.error(`❌ Unsplash search error: ${err.message}`);
    return null;
  }
}

// Helper: upload file to Supabase storage
async function uploadToSupabase(filePath, fileName) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(`product-images/${fileName}`, fileContent, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (err) {
    console.error(`❌ Upload error: ${err.message}`);
    return null;
  }
}

// Main function
async function populateImages() {
  console.log('🖼️  Product Image Populator');
  console.log('============================\n');

  const tmpDir = path.join(__dirname, '.tmp-images');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  let processed = 0;
  let updated = 0;
  let failed = 0;

  try {
    // Query products from vendor_products view (which is what the app uses)
    console.log('📦 Fetching products from database...');
    const { data: products, error } = await supabase
      .from('vendor_products')
      .select('id, title, slug, image_url')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Failed to query products:', error.message);
      process.exit(1);
    }

    if (!products || products.length === 0) {
      console.log('ℹ️  No products found in database.');
      process.exit(0);
    }

    console.log(`✓ Found ${products.length} products\n`);

    // Filter products without images
    const missing = products.filter(p => !p.image_url || p.image_url.length === 0);
    console.log(`🔍 ${missing.length} products missing images\n`);

    if (missing.length === 0) {
      console.log('✓ All products have images!');
      process.exit(0);
    }

    // Process each product missing an image
    for (const product of missing) {
      processed++;
      const searchQuery = product.title || product.slug || 'product';
      console.log(`[${processed}/${missing.length}] ${searchQuery.substring(0, 50)}...`);

      try {
        // Search for image
        const imageInfo = await searchUnsplash(searchQuery);
        if (!imageInfo) {
          console.log(`   → Skipped (no image found)\n`);
          continue;
        }

        console.log(`   → Found: "${imageInfo.photographer}"`);

        // Download image
        const tmpFile = path.join(tmpDir, `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
        console.log(`   → Downloading...`);
        await downloadFile(imageInfo.url, tmpFile);

        // Upload to Supabase
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        console.log(`   → Uploading to Supabase...`);
        const publicUrl = await uploadToSupabase(tmpFile, fileName);

        if (!publicUrl) {
          console.log(`   → Upload failed\n`);
          fs.unlinkSync(tmpFile);
          failed++;
          continue;
        }

        // Update product record
        console.log(`   → Updating product record...`);
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: publicUrl })
          .eq('id', product.id);

        if (updateError) {
          console.log(`   → Update failed: ${updateError.message}\n`);
          failed++;
        } else {
          console.log(`   ✓ Updated\n`);
          updated++;
        }

        // Clean up temp file
        fs.unlinkSync(tmpFile);

        // Rate limit: Unsplash free tier is 50/hour
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}\n`);
        failed++;
      }
    }

    // Summary
    console.log('\n📊 Summary');
    console.log('===========');
    console.log(`Total products: ${products.length}`);
    console.log(`Products missing images: ${missing.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped: ${missing.length - updated - failed}`);

    // Cleanup
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true });
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

populateImages();
