#!/usr/bin/env node
/**
 * DRY RUN: Show what migration would do without making changes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 IMAGE MIGRATION DRY RUN (No changes will be made)');
  console.log('='.repeat(80) + '\n');

  try {
    // Get all products
    const { data: products } = await supabase
      .from('products')
      .select('id, title, image_url');

    console.log(`Total products: ${products?.length || 0}\n`);

    // Categorize by URL type
    const byListingsImages = products?.filter(p => p.image_url?.includes('listings-images')) || [];
    const byProductImages = products?.filter(p => p.image_url?.includes('product-images')) || [];
    const noImage = products?.filter(p => !p.image_url) || [];

    console.log('📊 CURRENT IMAGE DISTRIBUTION:');
    console.log(`  listings-images bucket: ${byListingsImages.length} products`);
    console.log(`  product-images bucket:  ${byProductImages.length} products`);
    console.log(`  No image URL:           ${noImage.length} products\n`);

    // Show sample transformations
    console.log('🔄 SAMPLE TRANSFORMATIONS:');
    console.log(`\nShowing first 3 listings-images products:\n`);

    byListingsImages.slice(0, 3).forEach((p, i) => {
      const timestamp = Date.now() + i;
      const newFilename = `img_${p.id.substring(0, 8)}_${timestamp}.jpg`;
      const newUrl = `https://tmyxjsqhtxnuchmekbpt.supabase.co/storage/v1/object/public/product-images/${newFilename}`;

      console.log(`${i + 1}. "${p.title}"`);
      console.log(`   OLD: ${p.image_url?.substring(0, 80)}...`);
      console.log(`   NEW: ${newUrl}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('✅ READY FOR MIGRATION');
    console.log('='.repeat(80));
    console.log(`\nTo proceed with migration of ${byListingsImages.length} products,`);
    console.log('run: node scripts/migrate-all-images.js\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
