#!/usr/bin/env node
/**
 * Verify current image storage structure
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('📂 VERIFY IMAGE STORAGE STRUCTURE');
  console.log('='.repeat(80) + '\n');

  try {
    // Get all products
    const { data: products } = await supabase
      .from('products')
      .select('id, title, image_url');

    console.log(`Total products: ${products?.length || 0}\n`);

    // Categorize by URL type
    const byListingsVendors = products?.filter(p => 
      p.image_url?.includes('listings-images/vendors')
    ) || [];
    const byProductImages = products?.filter(p => 
      p.image_url?.includes('product-images')
    ) || [];
    const noImage = products?.filter(p => !p.image_url) || [];

    console.log('📊 IMAGE DISTRIBUTION:');
    console.log(`  listings-images/vendors/: ${byListingsVendors.length} products`);
    console.log(`  product-images/:          ${byProductImages.length} products`);
    console.log(`  No image:                 ${noImage.length} products\n`);

    // Show sample paths
    console.log('📍 SAMPLE PATHS (listings-images/vendors):\n');
    byListingsVendors.slice(0, 3).forEach(p => {
      const path = p.image_url.split('/storage/v1/object/public/')[1];
      console.log(`"${p.title}"`);
      console.log(`  ${path}\n`);
    });

    console.log('📍 SAMPLE PATHS (product-images):\n');
    byProductImages.slice(0, 3).forEach(p => {
      const path = p.image_url.split('/storage/v1/object/public/')[1];
      console.log(`"${p.title}"`);
      console.log(`  ${path}\n`);
    });

    // Verify vendor structure
    console.log('✔️  STRUCTURE VERIFICATION:\n');
    
    const hasVendorStructure = byListingsVendors.every(p => 
      p.image_url?.includes('vendors/') && p.image_url?.includes('/products/')
    );

    const hasNewFilenames = byListingsVendors.every(p => {
      const filename = p.image_url.split('/').pop();
      return filename?.startsWith('img_');
    });

    console.log(`  Has vendor structure: ${hasVendorStructure ? '✅' : '❌'}`);
    console.log(`  Has new filenames:    ${hasNewFilenames ? '✅' : '❌'}`);

    if (hasVendorStructure && hasNewFilenames) {
      console.log('\n✅ Storage structure is correctly organized!\n');
      console.log('Ready to add variant support by creating subdirectories:\n');
      console.log('  listings-images/vendors/[id]/products/[slug]/');
      console.log('  ├── img_[id]_[timestamp].jpg (main)');
      console.log('  └── variants/');
      console.log('      ├── img_variant_1.jpg');
      console.log('      └── img_variant_2.jpg\n');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
