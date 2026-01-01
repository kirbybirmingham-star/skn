/**
 * Image Migration Script
 * Migrates existing images to new UUID-based file structure
 * 
 * What it does:
 * 1. Finds all existing images in Supabase storage
 * 2. Renames them with UUID-based filenames (img_[16-char-uuid].ext)
 * 3. Updates database records to point to new URLs
 * 4. Handles products, variants, vendors, and user avatars
 * 5. Creates detailed migration report
 * 
 * Usage: node migrate-images-to-uuid.js
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY environment variables required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Buckets to migrate
const BUCKETS = [
  'product-images',
  'vendor-images',
  'user-avatars'
];

// Migration report
const report = {
  startTime: new Date(),
  bucket_migrations: {},
  database_updates: {
    products: 0,
    product_variants: 0,
    vendors: 0,
    users: 0
  },
  errors: [],
  warnings: []
};

/**
 * Generate UUID-based filename
 */
function generateImageFilename(originalFilename = '') {
  const uuid = uuidv4();
  const ext = originalFilename ? originalFilename.split('.').pop() : 'jpg';
  return `img_${uuid.replace(/-/g, '').substring(0, 16)}.${ext}`;
}

/**
 * Migrate images in a bucket
 */
async function migrateBucketImages(bucket) {
  console.log(`\n📦 Migrating bucket: ${bucket}`);
  
  const migrations = [];
  let fileCount = 0;
  let errorCount = 0;

  try {
    // List all files in bucket
    const { data: files, error: listError } = await supabase
      .storage
      .from(bucket)
      .list('', { limit: 1000 });

    if (listError) {
      const msg = `Failed to list files in ${bucket}: ${listError.message}`;
      report.errors.push(msg);
      console.error(`❌ ${msg}`);
      return { migrations: [], fileCount: 0, errorCount: 1 };
    }

    if (!files || files.length === 0) {
      console.log(`   ℹ️  No files found in ${bucket}`);
      return { migrations: [], fileCount: 0, errorCount: 0 };
    }

    // Process each file
    for (const file of files) {
      try {
        const oldFilename = file.name;
        const newFilename = generateImageFilename(oldFilename);

        // Copy file to new location
        const { data: fileData, error: downloadError } = await supabase
          .storage
          .from(bucket)
          .download(oldFilename);

        if (downloadError) {
          const msg = `Failed to download ${oldFilename} from ${bucket}: ${downloadError.message}`;
          report.errors.push(msg);
          console.error(`   ❌ ${msg}`);
          errorCount++;
          continue;
        }

        // Upload with new name
        const { error: uploadError } = await supabase
          .storage
          .from(bucket)
          .upload(newFilename, fileData);

        if (uploadError) {
          const msg = `Failed to upload ${newFilename} to ${bucket}: ${uploadError.message}`;
          report.errors.push(msg);
          console.error(`   ❌ ${msg}`);
          errorCount++;
          continue;
        }

        // Delete old file
        const { error: deleteError } = await supabase
          .storage
          .from(bucket)
          .remove([oldFilename]);

        if (deleteError) {
          const msg = `Failed to delete ${oldFilename} from ${bucket}: ${deleteError.message}`;
          report.warnings.push(msg);
          console.warn(`   ⚠️  ${msg}`);
          // Don't count as error - file was copied successfully
        }

        const newUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${newFilename}`;
        
        migrations.push({
          bucket,
          oldFilename,
          newFilename,
          newUrl,
          timestamp: new Date()
        });

        fileCount++;
        console.log(`   ✅ ${oldFilename} → ${newFilename}`);

      } catch (err) {
        const msg = `Error processing ${file.name}: ${err.message}`;
        report.errors.push(msg);
        console.error(`   ❌ ${msg}`);
        errorCount++;
      }
    }

  } catch (err) {
    const msg = `Fatal error in bucket ${bucket}: ${err.message}`;
    report.errors.push(msg);
    console.error(`❌ ${msg}`);
    errorCount++;
  }

  report.bucket_migrations[bucket] = {
    filesProcessed: fileCount,
    errors: errorCount,
    migrations
  };

  return { migrations, fileCount, errorCount };
}

/**
 * Update product images in database
 */
async function updateProductImages(migrations) {
  console.log(`\n🗄️  Updating product images in database...`);

  const productMigrations = migrations.filter(m => m.bucket === 'product-images');
  
  if (productMigrations.length === 0) {
    console.log('   ℹ️  No product images to update');
    return;
  }

  // Get all products with images
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, image_url')
    .not('image_url', 'is', null);

  if (productsError) {
    const msg = `Failed to fetch products: ${productsError.message}`;
    report.errors.push(msg);
    console.error(`   ❌ ${msg}`);
    return;
  }

  if (!products || products.length === 0) {
    console.log('   ℹ️  No products with images found');
    return;
  }

  // Update each product if URL matches old files
  for (const product of products) {
    try {
      const oldUrl = product.image_url;
      
      // Find matching migration
      const migration = productMigrations.find(m => 
        oldUrl.includes(m.oldFilename) || oldUrl.includes(m.oldFilename.replace(/\.[^.]+$/, ''))
      );

      if (migration) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: migration.newUrl })
          .eq('id', product.id);

        if (updateError) {
          console.error(`   ❌ Failed to update product ${product.id}: ${updateError.message}`);
          report.errors.push(`Product update error: ${updateError.message}`);
        } else {
          report.database_updates.products++;
          console.log(`   ✅ Product ${product.id.substring(0, 8)}... updated`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Error updating product: ${err.message}`);
      report.errors.push(`Product update exception: ${err.message}`);
    }
  }
}

/**
 * Update variant images in database
 */
async function updateVariantImages(migrations) {
  console.log(`\n🗄️  Updating variant images in database...`);

  const productMigrations = migrations.filter(m => m.bucket === 'product-images');
  
  if (productMigrations.length === 0) {
    console.log('   ℹ️  No variant images to update');
    return;
  }

  // Get all variants with images
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('id, image_url')
    .not('image_url', 'is', null);

  if (variantsError) {
    const msg = `Failed to fetch variants: ${variantsError.message}`;
    report.errors.push(msg);
    console.error(`   ❌ ${msg}`);
    return;
  }

  if (!variants || variants.length === 0) {
    console.log('   ℹ️  No variants with images found');
    return;
  }

  // Update each variant if URL matches old files
  for (const variant of variants) {
    try {
      const oldUrl = variant.image_url;
      
      // Find matching migration
      const migration = productMigrations.find(m => 
        oldUrl.includes(m.oldFilename) || oldUrl.includes(m.oldFilename.replace(/\.[^.]+$/, ''))
      );

      if (migration) {
        const { error: updateError } = await supabase
          .from('product_variants')
          .update({ image_url: migration.newUrl })
          .eq('id', variant.id);

        if (updateError) {
          console.error(`   ❌ Failed to update variant ${variant.id}: ${updateError.message}`);
          report.errors.push(`Variant update error: ${updateError.message}`);
        } else {
          report.database_updates.product_variants++;
          console.log(`   ✅ Variant ${variant.id.substring(0, 8)}... updated`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Error updating variant: ${err.message}`);
      report.errors.push(`Variant update exception: ${err.message}`);
    }
  }
}

/**
 * Update vendor images in database
 */
async function updateVendorImages(migrations) {
  console.log(`\n🗄️  Updating vendor images in database...`);

  const vendorMigrations = migrations.filter(m => m.bucket === 'vendor-images');
  
  if (vendorMigrations.length === 0) {
    console.log('   ℹ️  No vendor images to update');
    return;
  }

  // Get all vendors with images
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .select('id, image_url')
    .not('image_url', 'is', null);

  if (vendorsError) {
    const msg = `Failed to fetch vendors: ${vendorsError.message}`;
    report.errors.push(msg);
    console.error(`   ❌ ${msg}`);
    return;
  }

  if (!vendors || vendors.length === 0) {
    console.log('   ℹ️  No vendors with images found');
    return;
  }

  // Update each vendor if URL matches old files
  for (const vendor of vendors) {
    try {
      const oldUrl = vendor.image_url;
      
      // Find matching migration
      const migration = vendorMigrations.find(m => 
        oldUrl.includes(m.oldFilename) || oldUrl.includes(m.oldFilename.replace(/\.[^.]+$/, ''))
      );

      if (migration) {
        const { error: updateError } = await supabase
          .from('vendors')
          .update({ image_url: migration.newUrl })
          .eq('id', vendor.id);

        if (updateError) {
          console.error(`   ❌ Failed to update vendor ${vendor.id}: ${updateError.message}`);
          report.errors.push(`Vendor update error: ${updateError.message}`);
        } else {
          report.database_updates.vendors++;
          console.log(`   ✅ Vendor ${vendor.id.substring(0, 8)}... updated`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Error updating vendor: ${err.message}`);
      report.errors.push(`Vendor update exception: ${err.message}`);
    }
  }
}

/**
 * Update user avatars in database
 */
async function updateUserAvatars(migrations) {
  console.log(`\n🗄️  Updating user avatars in database...`);

  const avatarMigrations = migrations.filter(m => m.bucket === 'user-avatars');
  
  if (avatarMigrations.length === 0) {
    console.log('   ℹ️  No user avatars to update');
    return;
  }

  // Get all users with avatars (if your users table has avatar field)
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, avatar_url')
      .not('avatar_url', 'is', null);

    if (usersError) {
      console.log('   ℹ️  Users table not found or avatar_url column missing');
      return;
    }

    if (!users || users.length === 0) {
      console.log('   ℹ️  No users with avatars found');
      return;
    }

    // Update each user if URL matches old files
    for (const user of users) {
      try {
        const oldUrl = user.avatar_url;
        
        // Find matching migration
        const migration = avatarMigrations.find(m => 
          oldUrl.includes(m.oldFilename) || oldUrl.includes(m.oldFilename.replace(/\.[^.]+$/, ''))
        );

        if (migration) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ avatar_url: migration.newUrl })
            .eq('id', user.id);

          if (updateError) {
            console.error(`   ❌ Failed to update user ${user.id}: ${updateError.message}`);
            report.errors.push(`User update error: ${updateError.message}`);
          } else {
            report.database_updates.users++;
            console.log(`   ✅ User ${user.id.substring(0, 8)}... updated`);
          }
        }
      } catch (err) {
        console.error(`   ❌ Error updating user: ${err.message}`);
        report.errors.push(`User update exception: ${err.message}`);
      }
    }
  } catch (err) {
    console.log('   ℹ️  Could not update users table:', err.message);
  }
}

/**
 * Generate migration report
 */
async function generateReport() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 MIGRATION REPORT');
  console.log(`${'='.repeat(60)}\n`);

  report.endTime = new Date();
  report.duration = Math.round((report.endTime - report.startTime) / 1000);

  // Summary
  console.log('📈 Summary:');
  console.log(`   Start Time: ${report.startTime.toISOString()}`);
  console.log(`   End Time: ${report.endTime.toISOString()}`);
  console.log(`   Duration: ${report.duration} seconds\n`);

  // Bucket migrations
  console.log('📦 Storage Migrations:');
  let totalFiles = 0;
  let totalErrors = 0;
  
  for (const bucket of BUCKETS) {
    const stats = report.bucket_migrations[bucket];
    if (stats) {
      console.log(`   ${bucket}: ${stats.filesProcessed} files migrated${stats.errors > 0 ? `, ${stats.errors} errors` : ''}`);
      totalFiles += stats.filesProcessed;
      totalErrors += stats.errors;
    }
  }
  
  console.log(`   Total: ${totalFiles} files migrated\n`);

  // Database updates
  console.log('🗄️  Database Updates:');
  console.log(`   Products: ${report.database_updates.products} updated`);
  console.log(`   Variants: ${report.database_updates.product_variants} updated`);
  console.log(`   Vendors: ${report.database_updates.vendors} updated`);
  console.log(`   Users: ${report.database_updates.users} updated`);
  console.log(`   Total: ${
    report.database_updates.products + 
    report.database_updates.product_variants + 
    report.database_updates.vendors + 
    report.database_updates.users
  } records updated\n`);

  // Warnings
  if (report.warnings.length > 0) {
    console.log(`⚠️  Warnings (${report.warnings.length}):`);
    report.warnings.forEach(w => console.log(`   - ${w}`));
    console.log('');
  }

  // Errors
  if (report.errors.length > 0) {
    console.log(`❌ Errors (${report.errors.length}):`);
    report.errors.forEach(e => console.log(`   - ${e}`));
    console.log('');
  }

  // Status
  const status = report.errors.length === 0 ? '✅ SUCCESS' : '⚠️  COMPLETED WITH ERRORS';
  console.log(`${status}\n`);

  // Save report to file
  const reportPath = path.join(process.cwd(), 'MIGRATION_REPORT.json');
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report saved to: MIGRATION_REPORT.json\n`);
}

/**
 * Main migration process
 */
async function runMigration() {
  console.log('\n🚀 Starting Image Migration to UUID-Based Structure\n');

  try {
    // Step 1: Migrate storage buckets
    console.log('Step 1: Migrating Image Storage');
    const allMigrations = [];

    for (const bucket of BUCKETS) {
      const { migrations } = await migrateBucketImages(bucket);
      allMigrations.push(...migrations);
    }

    if (allMigrations.length === 0) {
      console.log('\n⚠️  No images found to migrate');
      return;
    }

    // Step 2: Update database records
    console.log('\n\nStep 2: Updating Database Records');
    await updateProductImages(allMigrations);
    await updateVariantImages(allMigrations);
    await updateVendorImages(allMigrations);
    await updateUserAvatars(allMigrations);

    // Step 3: Generate report
    await generateReport();

  } catch (err) {
    console.error('\n❌ Fatal error during migration:', err);
    report.errors.push(`Fatal error: ${err.message}`);
    await generateReport();
    process.exit(1);
  }
}

// Run migration
runMigration().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
