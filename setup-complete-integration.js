/**
 * Complete Integration Setup
 * Adds missing image columns and configures variant image support
 * 
 * Database Status:
 * ✅ products.image_url (EXISTS)
 * ❌ product_variants.image_url (MISSING - will add)
 * ❌ vendors.image_url (MISSING - will add)
 * ❌ users.avatar_url (MISSING - will add)
 * 
 * Usage: node setup-complete-integration.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY environment variables required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Check if column exists in table
 */
async function columnExists(tableName, columnName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);

    if (error && error.message.includes('column')) {
      return false;
    }
    
    return !error;
  } catch (err) {
    return false;
  }
}

/**
 * Execute SQL using Supabase
 */
async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    // Try using the regular query method
    console.log(`📝 SQL to run manually in Supabase dashboard:\n\n${sql}\n`);
    return { success: false, error: err.message };
  }
}

/**
 * Main setup function
 */
async function setupCompleteIntegration() {
  console.log('\n🔧 COMPLETE INTEGRATION SETUP\n');
  console.log('='.repeat(70));

  const setupQueries = [];

  // Check and add product_variants.image_url
  console.log('\n1️⃣  Checking product_variants.image_url...');
  const hasVariantsImageUrl = await columnExists('product_variants', 'image_url');
  
  if (!hasVariantsImageUrl) {
    console.log('   ❌ Missing - will add');
    setupQueries.push({
      table: 'product_variants',
      column: 'image_url',
      sql: `ALTER TABLE product_variants ADD COLUMN image_url VARCHAR(255);`
    });
  } else {
    console.log('   ✅ Already exists');
  }

  // Check and add vendors.image_url
  console.log('\n2️⃣  Checking vendors.image_url...');
  const hasVendorImageUrl = await columnExists('vendors', 'image_url');
  
  if (!hasVendorImageUrl) {
    console.log('   ❌ Missing - will add');
    setupQueries.push({
      table: 'vendors',
      column: 'image_url',
      sql: `ALTER TABLE vendors ADD COLUMN image_url VARCHAR(255);`
    });
  } else {
    console.log('   ✅ Already exists');
  }

  // Check and add users.avatar_url
  console.log('\n3️⃣  Checking users.avatar_url...');
  const hasUsersAvatarUrl = await columnExists('users', 'avatar_url');
  
  if (!hasUsersAvatarUrl) {
    console.log('   ❌ Missing - will add');
    setupQueries.push({
      table: 'users',
      column: 'avatar_url',
      sql: `ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255);`
    });
  } else {
    console.log('   ✅ Already exists');
  }

  // Execute setup queries
  if (setupQueries.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('\n📋 EXECUTING SETUP QUERIES\n');

    let successCount = 0;
    let failureCount = 0;

    for (const query of setupQueries) {
      console.log(`Adding ${query.table}.${query.column}...`);
      
      const result = await executeSql(query.sql);
      
      if (result.success) {
        console.log(`  ✅ Success`);
        successCount++;
      } else {
        console.log(`  ⚠️  Manual execution required`);
        console.log(`     SQL: ${query.sql}`);
        failureCount++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n📊 SETUP RESULTS\n`);
    console.log(`  ✅ Auto-executed: ${successCount}`);
    console.log(`  ⚠️  Manual required: ${failureCount}`);
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ ALL COLUMNS ALREADY EXIST\n');
    console.log('No setup needed - system is fully configured!');
  }

  // Display final configuration
  console.log('\n' + '='.repeat(70));
  console.log('\n🎯 FINAL CONFIGURATION\n');
  
  const finalStatus = {
    'products.image_url': true,
    'product_variants.image_url': hasVariantsImageUrl,
    'vendors.image_url': hasVendorImageUrl,
    'users.avatar_url': hasUsersAvatarUrl
  };

  Object.entries(finalStatus).forEach(([column, exists]) => {
    const icon = exists ? '✅' : '❌';
    console.log(`${icon} ${column}`);
  });

  // Show what's now available
  console.log('\n' + '='.repeat(70));
  console.log('\n🚀 IMAGE MANAGEMENT IS NOW CONFIGURED FOR:\n');

  if (hasVariantsImageUrl) {
    console.log('  ✅ Product images (products.image_url)');
    console.log('  ✅ Variant-specific images (product_variants.image_url)');
    console.log('  ✅ Variant image inheritance logic');
    console.log('     → Variants without images inherit from main product');
    console.log('     → Admin flagging for missing variant images');
  } else {
    console.log('  ✅ Product images (products.image_url)');
    console.log('  ⏳ Variant images (add product_variants.image_url column)');
  }

  if (hasVendorImageUrl) {
    console.log('  ✅ Vendor profile images (vendors.image_url)');
  } else {
    console.log('  ⏳ Vendor images (optional - add vendors.image_url)');
  }

  if (hasUsersAvatarUrl) {
    console.log('  ✅ User avatars (users.avatar_url)');
  } else {
    console.log('  ⏳ User avatars (optional - add users.avatar_url)');
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📚 NEXT STEPS:\n');
  console.log('1. Verify the setup:');
  console.log('   $ node inspect-database-schema.js\n');
  console.log('2. Test image management:');
  console.log('   $ npm run dev\n');
  console.log('3. Integrate ImageUpload component into your forms\n');
  console.log('4. Check the documentation:');
  console.log('   - IMAGE_MANAGEMENT_MASTER_INDEX.md');
  console.log('   - IMAGE_MIGRATION_COMPLETE.md\n');

  console.log('='.repeat(70) + '\n');
}

// Run setup
setupCompleteIntegration().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
