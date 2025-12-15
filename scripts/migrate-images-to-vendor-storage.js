#!/usr/bin/env node
/**
 * Migrate Product Images to Vendor-Organized Storage
 * 
 * This script:
 * 1. Reads the migration map from scan-bucket-for-images.js
 * 2. Copies images from old paths to new vendor-organized paths
 * 3. Updates product records with new image URLs
 * 4. Reports success/failures
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import {
  getProductMainImagePath,
  getPublicUrl
} from '../src/lib/storagePathBuilder.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const BUCKET = 'listings-images';
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

// Parse command line arguments
const dryRun = process.argv.includes('--dry-run');
const limitArg = process.argv.findIndex(arg => arg === '--limit');
const limit = limitArg >= 0 ? parseInt(process.argv[limitArg + 1], 10) : null;

/**
 * Copy/download file and upload to new path
 */
async function copyImage(oldPath, newPath, currentImageUrl) {
  try {
    let fileData;

    // Check if we have a current image URL (from different bucket)
    if (currentImageUrl && currentImageUrl.includes('http')) {
      // If the source is a Supabase public storage URL, download directly from that bucket
      console.log(`    → Downloading from external URL: ${currentImageUrl}`);
      const publicPrefix = '/storage/v1/object/public/';
      if (currentImageUrl.includes(publicPrefix)) {
        const parts = currentImageUrl.split(publicPrefix)[1];
        // parts starts with '<bucket>/<path...>'
        const idx = parts.indexOf('/');
        const sourceBucket = parts.substring(0, idx);
        const sourcePath = parts.substring(idx + 1);
        console.log(`    → Detected source bucket: ${sourceBucket}, path: ${sourcePath}`);
        const { data, error: downloadError } = await supabase.storage.from(sourceBucket).download(sourcePath);
        if (downloadError) throw downloadError;
        fileData = data;
      } else {
        // Fallback: HTTP fetch
        const response = await fetch(currentImageUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const ab = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        // Only allow image content types (including SVG)
        if (!/image\//i.test(contentType) && !/svg\+xml/i.test(contentType)) {
          throw new Error(`mime type ${contentType} is not supported`);
        }
        fileData = Buffer.from(ab);
      }
    } else {
      // Try to download from listings-images bucket
      const { data, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(oldPath);

      if (downloadError) throw downloadError;
      fileData = data;
    }

    // Upload to new location
    const uploadOptions = { upsert: true };
    // If fileData is a Buffer and we have a content type from previous fetch, attach it
    if (typeof fileData !== 'undefined' && fileData !== null && fileData.type) {
      uploadOptions.contentType = fileData.type;
    }
    // attempt to detect content type if response provided one
    // note: for external fetch we set contentType above and passed as uploadOptions.contentType
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(newPath, fileData, uploadOptions);

    if (uploadError) throw uploadError;

    return true;
  } catch (err) {
    console.error(`  Failed to migrate image: ${err.message}`);
    return false;
  }
}

/**
 * Migrate a single product's images
 */
async function migrateProduct(migration, index, total) {
  const { productSlug, vendorId, oldPath, newPath, currentImageUrl } = migration;

  console.log(`\n[${index}/${total}] ${productSlug}`);

  if (!oldPath && !currentImageUrl) {
    console.log('  ⊘ No image to migrate');
    return { status: 'skipped', reason: 'no_image' };
  }

  try {
    if (dryRun) {
      console.log('  [DRY RUN] Would copy:');
      console.log(`    From: ${currentImageUrl || oldPath}`);
      console.log(`    To:   ${newPath}`);
      return { status: 'dry_run' };
    }

    console.log(`  → Migrating image...`);
    const success = await copyImage(oldPath, newPath, currentImageUrl);

    if (!success) {
      return { status: 'failed', reason: 'copy_failed' };
    }

    console.log(`  → Updating product record...`);
    const publicUrl = getPublicUrl(supabaseUrl, BUCKET, newPath);

    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: publicUrl })
      .eq('id', migration.productId);

    if (updateError) {
      console.log(`  ⚠ Update failed:`, updateError.message);
      return { status: 'failed', reason: 'update_failed' };
    }

    console.log(`  ✅ Migrated`);
    console.log(`     URL: ${publicUrl.substring(0, 60)}...`);
    return { status: 'success', url: publicUrl };
  } catch (err) {
    console.error(`  ❌ Error:`, err.message);
    return { status: 'failed', reason: err.message };
  }
}

/**
 * Main migration
 */
async function main() {
  console.log('🚀 Product Image Migration');
  console.log('============================\n');

  // Load migration map
  if (!fs.existsSync('migration-map.json')) {
    console.error('❌ migration-map.json not found!');
    console.log('   Run: node scripts/scan-bucket-for-images.js');
    process.exit(1);
  }

  const migrationData = JSON.parse(fs.readFileSync('migration-map.json', 'utf8'));
  let migrations = migrationData.migrations.filter(m => m.oldPath || m.currentImageUrl);

  console.log(`📊 Found ${migrations.length} products with images to migrate`);
  if (limit) {
    migrations = migrations.slice(0, limit);
    console.log(`📌 Limited to ${limit} products\n`);
  } else {
    console.log();
  }

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  const results = [];
  for (let i = 0; i < migrations.length; i++) {
    const result = await migrateProduct(migrations[i], i + 1, migrations.length);
    results.push(result);

    // Add delay to avoid rate limiting
    if (i < migrations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Report
  console.log('\n\n📊 Migration Summary');
  console.log('='.repeat(60));

  const succeeded = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const dryRuns = results.filter(r => r.status === 'dry_run').length;

  console.log(`✅ Succeeded: ${succeeded}`);
  console.log(`❌ Failed: ${failed}`);
  if (skipped > 0) console.log(`⊘ Skipped: ${skipped}`);
  if (dryRuns > 0) console.log(`🔍 Dry runs: ${dryRuns}`);

  if (failed > 0) {
    console.log('\nFailed products:');
    results.forEach((result, idx) => {
      if (result.status === 'failed') {
        console.log(`  - ${migrations[idx].productSlug} (${result.reason})`);
      }
    });
  }

  console.log('\n' + '='.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
