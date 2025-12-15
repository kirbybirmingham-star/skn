import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';
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

async function migrateExistingImages() {
  console.log('📁 Migrating existing images to vendor-organized structure\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Map of old image paths to product info
    const imagesToMigrate = [
      {
        oldPath: 'bluetooth-speaker.jpg',
        slug: 'bluetooth-speaker',
        vendorId: '0f134cb6-9ee5-4e4d-ba50-528cb55d3ca3',
        productId: 'cc694b1a-541c-4fff-8d34-77873bcf999d'
      }
    ];

    console.log(`📦 Found ${imagesToMigrate.length} existing images to migrate\n`);

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < imagesToMigrate.length; i++) {
      const migration = imagesToMigrate[i];
      const { oldPath, slug, vendorId, productId } = migration;

      console.log(`[${i + 1}/${imagesToMigrate.length}] ${slug}`);
      console.log(`  Old path: ${oldPath}`);

      try {
        // Download from old location
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(BUCKET)
          .download(oldPath);

        if (downloadError) throw downloadError;
        console.log(`  ✓ Downloaded (${(fileData.size / 1024).toFixed(1)}KB)`);

        // Generate new path
        const newPath = getProductMainImagePath(vendorId, slug);
        console.log(`  New path: ${newPath}`);

        // Upload to new location
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(newPath, fileData, { upsert: true, contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;
        console.log(`  ✓ Uploaded to vendor folder`);

        // Generate public URL
        const publicUrl = getPublicUrl(supabaseUrl, BUCKET, newPath);
        console.log(`  ✓ Public URL: ${publicUrl.substring(0, 80)}...`);

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
    console.log(`  📁 Images now in vendor-organized structure\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

migrateExistingImages();
