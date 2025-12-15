import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import {
  getProductMainImagePath,
  getPublicUrl
} from '../src/lib/storagePathBuilder.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'listings-images';
const supabaseUrl = process.env.VITE_SUPABASE_URL;

async function migrateIslandCurry() {
  console.log('🥄 Migrating Island Curry Powder Blend image\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Get product
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('slug', 'island-curry-powder-blend')
      .single();

    const { vendor_id: vendorId, id: productId, slug, gallery_images } = product;

    if (!gallery_images || gallery_images.length === 0) {
      console.log('❌ No gallery images found for this product');
      return;
    }

    const imageUrl = gallery_images[0];
    console.log(`📦 Product: ${slug}`);
    console.log(`   Vendor: ${vendorId}`);
    console.log(`   Source URL: ${imageUrl}\n`);

    // Download from external URL
    console.log('📥 Downloading from skn-bridge-assets...');
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.buffer();
    console.log(`✓ Downloaded (${(buffer.length / 1024).toFixed(1)}KB)\n`);

    // Generate new path
    const newPath = getProductMainImagePath(vendorId, slug);
    console.log(`📁 Uploading to: ${newPath}`);

    // Upload to vendor folder
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(newPath, buffer, { upsert: true, contentType: 'image/jpeg' });

    if (uploadError) throw uploadError;
    console.log(`✓ Uploaded to vendor folder\n`);

    // Generate public URL
    const publicUrl = getPublicUrl(supabaseUrl, BUCKET, newPath);
    console.log(`🔗 Public URL: ${publicUrl}\n`);

    // Update product record
    console.log('💾 Updating database...');
    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: publicUrl })
      .eq('id', productId);

    if (updateError) throw updateError;
    console.log(`✓ Product updated\n`);

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Island Curry Powder Blend image migrated successfully!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

migrateIslandCurry();
