#!/usr/bin/env node
/**
 * Inspect actual storage buckets to see file structure
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listBucketContents(bucketName, path = '') {
  console.log(`\n📂 ${bucketName}/${path}\n`);
  
  try {
    const { data: files, error } = await supabase
      .storage
      .from(bucketName)
      .list(path, {
        limit: 50,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.log(`  ⚠️  Error: ${error.message}`);
      return;
    }

    if (!files || files.length === 0) {
      console.log('  (empty)');
      return;
    }

    files.forEach(f => {
      if (f.id) {
        // It's a file
        console.log(`  📄 ${f.name}`);
      } else {
        // It's a folder
        console.log(`  📁 ${f.name}/`);
      }
    });
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 STORAGE BUCKET INSPECTION');
  console.log('='.repeat(80));

  try {
    // Check product-images
    await listBucketContents('product-images');

    // Check listings-images
    await listBucketContents('listings-images');

    // Check listings-images/vendors (if it exists)
    const { data: vendorsList } = await supabase
      .storage
      .from('listings-images')
      .list('vendors', { limit: 50 });

    if (vendorsList && vendorsList.length > 0) {
      console.log('\n📂 listings-images/vendors/\n');
      vendorsList.slice(0, 3).forEach(v => {
        console.log(`  📁 ${v.name}/`);
      });
      if (vendorsList.length > 3) {
        console.log(`  ... and ${vendorsList.length - 3} more vendors`);
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

main();
