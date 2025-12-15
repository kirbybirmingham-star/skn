import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
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

async function migrateRootImages() {
  console.log('📁 Migrating root-level images to vendor-organized structure\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Get all products for matching
    const { data: products } = await supabase
      .from('products')
      .select('id, title, slug, vendor_id')
      .not('vendor_id', 'is', null);

    // Map images to products by slug matching
    const imagesToMigrate = [
      { oldPath: 'bread.webp', slug: 'artisan-bread-loaf' },
      { oldPath: 'coffee.jpg', slug: 'organic-coffee-beans' },
      { oldPath: 'fitness-tracker.jpg', slug: 'smart-fitness-tracker' },
      { oldPath: 'headphones.jpg', slug: 'premium-wireless-headphones' },
      { oldPath: 'honey.jpg', slug: 'organic-honey' },
      { oldPath: 'pasta-sauce.jpg', slug: 'gourmet-pasta-sauce' },
      { oldPath: 'power-bank.jpg', slug: 'portable-power-bank' }
    ];

    console.log(`📦 Found ${imagesToMigrate.length} root images to migrate\n`);

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < imagesToMigrate.length; i++) {
      const { oldPath, slug } = imagesToMigrate[i];
      
      // Find product
      const product = products.find(p => p.slug === slug);
      if (!product) {
        console.log(`[${i + 1}/${imagesToMigrate.length}] ${oldPath}`);
        console.log(`  ❌ No product found for slug: ${slug}\n`);
        failed++;
        continue;
      }

      const { vendor_id: vendorId, id: productId } = product;

      console.log(`[${i + 1}/${imagesToMigrate.length}] ${slug}`);
      console.log(`  Old path: ${oldPath}`);

      try {
        // Download from old location
        let fileData = await supabase.storage
          .from(BUCKET)
          .download(oldPath)
          .then(res => {
            if (res.error) throw res.error;
            return res.data;
          });

        console.log(`  ✓ Downloaded (${(fileData.size / 1024).toFixed(1)}KB)`);

        // Convert webp to jpg if needed
        if (oldPath.endsWith('.webp')) {
          console.log(`  Converting webp to jpg...`);
          try {
            fileData = await sharp(fileData)
              .jpeg({ quality: 85, progressive: true })
              .toBuffer();
            console.log(`  ✓ Converted (${(fileData.length / 1024).toFixed(1)}KB)`);
          } catch (convertErr) {
            console.log(`  ⚠️  Could not convert webp, using original`);
          }
        }

        // Generate new path (convert to .jpg)
        const newPath = getProductMainImagePath(vendorId, slug);
        console.log(`  New path: ${newPath}`);

        // Upload to new location
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(newPath, fileData, { upsert: true });

        if (uploadError) throw uploadError;
        console.log(`  ✓ Uploaded to vendor folder`);

        // Generate public URL
        const publicUrl = getPublicUrl(supabaseUrl, BUCKET, newPath);
        console.log(`  ✓ Public URL generated`);

        // Update product record
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: publicUrl })
          .eq('id', productId);

        if (updateError) throw updateError;
        console.log(`  ✓ Database updated`);

        // Delete old file
        const { error: deleteError } = await supabase.storage
          .from(BUCKET)
          .remove([oldPath]);

        if (deleteError) {
          console.log(`  ⚠️  Could not delete old file: ${deleteError.message}`);
        } else {
          console.log(`  ✓ Old file removed`);
        }

        succeeded++;
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
        failed++;
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n📊 Results:`);
    console.log(`  ✅ Migrated: ${succeeded}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📁 Images now organized by vendor\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

migrateRootImages();
