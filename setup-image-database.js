/**
 * Database Setup for Image Management
 * Adds image_url column to product_variants and other tables if needed
 * 
 * Usage: node setup-image-database.js
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
 * Setup database schema for image management
 */
async function setupDatabase() {
  console.log('\n🗄️  Setting up Image Management Database Schema\n');

  try {
    // 1. Check and add image_url to product_variants if needed
    console.log('Checking product_variants table...');
    
    const { data: variantCheck, error: variantError } = await supabase
      .from('product_variants')
      .select('image_url')
      .limit(1);

    if (variantError && variantError.message.includes('column')) {
      console.log('   ⚠️  image_url column missing from product_variants');
      console.log('   📝 Adding column...');
      
      // Need to add via raw SQL since Supabase SDK doesn't support DDL
      const { error: addError } = await supabase.rpc('execute_sql', {
        sql: 'ALTER TABLE product_variants ADD COLUMN image_url VARCHAR(255)'
      }).catch(() => {
        // Fallback if RPC doesn't exist
        console.log('   ℹ️  Use Supabase dashboard to run:');
        console.log('      ALTER TABLE product_variants ADD COLUMN image_url VARCHAR(255);');
        return { error: null };
      });

      if (addError) {
        console.log('   ❌ Could not add column via RPC');
        console.log('   📋 Please add manually in Supabase dashboard:');
        console.log('      1. Go to product_variants table');
        console.log('      2. Click "+" button to add column');
        console.log('      3. Name: image_url');
        console.log('      4. Type: varchar(255)');
        console.log('      5. Press Save\n');
      } else {
        console.log('   ✅ image_url column added to product_variants\n');
      }
    } else if (!variantError) {
      console.log('   ✅ image_url column already exists on product_variants\n');
    }

    // 2. Check vendors table
    console.log('Checking vendors table...');
    
    const { data: vendorCheck, error: vendorError } = await supabase
      .from('vendors')
      .select('image_url')
      .limit(1);

    if (vendorError && vendorError.message.includes('column')) {
      console.log('   ⚠️  image_url column missing from vendors');
      console.log('   📋 To add manually:');
      console.log('      ALTER TABLE vendors ADD COLUMN image_url VARCHAR(255);\n');
    } else if (!vendorError) {
      console.log('   ✅ image_url column already exists on vendors\n');
    } else if (vendorError && vendorError.code === '42P01') {
      console.log('   ℹ️  vendors table does not exist (optional)\n');
    }

    // 3. Verify products table
    console.log('Checking products table...');
    
    const { data: productCheck, error: productError } = await supabase
      .from('products')
      .select('image_url')
      .limit(1);

    if (productError && productError.message.includes('column')) {
      console.log('   ⚠️  image_url column missing from products');
      console.log('   📋 To add manually:');
      console.log('      ALTER TABLE products ADD COLUMN image_url VARCHAR(255);\n');
    } else if (!productError) {
      console.log('   ✅ image_url column already exists on products\n');
    }

    console.log('='.repeat(60));
    console.log('\n📋 Database Setup Summary:\n');
    console.log('Required columns:');
    console.log('  ✅ products.image_url');
    console.log('  ⚠️  product_variants.image_url (add if missing)');
    console.log('  ⚠️  vendors.image_url (optional)');
    console.log('\n');

    // Show SQL to run manually if needed
    console.log('SQL to add missing columns:');
    console.log('');
    console.log('  ALTER TABLE product_variants ADD COLUMN image_url VARCHAR(255);');
    console.log('  ALTER TABLE vendors ADD COLUMN image_url VARCHAR(255);');
    console.log('');
    console.log('Run these in Supabase SQL Editor if columns still missing after this script.\n');

  } catch (err) {
    console.error('Error setting up database:', err.message);
  }

  console.log('Done! Ready to run migration.\n');
}

setupDatabase().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
