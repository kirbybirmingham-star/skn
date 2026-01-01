#!/usr/bin/env node
/**
 * Clean up legacy product-images bucket
 * All images have been migrated to listings-images/vendors/...
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n🧹 CLEANUP LEGACY STORAGE\n');
  console.log('='.repeat(80));
  console.log('Removing legacy product-images bucket (all migrated to vendor structure)');
  console.log('='.repeat(80) + '\n');

  try {
    // List all files in product-images bucket
    const { data: files, error: listError } = await supabase
      .storage
      .from('product-images')
      .list();

    if (listError) {
      console.log('❌ Error listing files:', listError.message);
      return;
    }

    console.log(`📦 Found ${files.length} files in product-images bucket\n`);

    if (files.length === 0) {
      console.log('✅ Product-images bucket is already empty\n');
      return;
    }

    // Delete all files
    const filenames = files.map(f => f.name);
    
    console.log('🗑️  Deleting files:\n');
    for (const filename of filenames) {
      console.log(`   - ${filename}`);
    }

    const { error: deleteError } = await supabase
      .storage
      .from('product-images')
      .remove(filenames);

    if (deleteError) {
      console.log('\n❌ Error deleting files:', deleteError.message);
      return;
    }

    console.log('\n✅ All legacy files deleted\n');

    console.log('='.repeat(80));
    console.log('✨ CLEANUP COMPLETE');
    console.log('='.repeat(80));
    console.log('\n📂 FINAL STORAGE STRUCTURE:\n');
    console.log('listings-images/');
    console.log('└── vendors/');
    console.log('    ├── [vendor_uuid]/');
    console.log('    │   └── products/');
    console.log('    │       ├── [product_slug_1]/');
    console.log('    │       │   ├── img_[id]_[timestamp].jpg');
    console.log('    │       │   └── variants/');
    console.log('    │       └── [product_slug_2]/');
    console.log('    │           └── img_[id]_[timestamp].jpg');
    console.log('    └── [more vendors...]\n');
    console.log('product-images/ → REMOVED (legacy, all migrated)\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
