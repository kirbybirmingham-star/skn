#!/usr/bin/env node
/**
 * Script to normalize product image URLs to use product-images bucket
 * and verify they all exist in storage
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 NORMALIZING PRODUCT IMAGE URLS');
  console.log('='.repeat(80) + '\n');

  try {
    // Get all products with listings-images paths
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, image_url');

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }

    console.log(`📦 Found ${products?.length || 0} products\n`);

    // Find products with old listings-images paths
    const oldPathProducts = products?.filter(p => 
      p.image_url && p.image_url.includes('listings-images')
    ) || [];

    if (oldPathProducts.length === 0) {
      console.log('✅ All products already use normalized paths');
      return;
    }

    console.log(`⚠️  Found ${oldPathProducts.length} products with old listings-images paths:\n`);

    for (const product of oldPathProducts) {
      console.log(`- "${product.title}"`);
      console.log(`  Old: ${product.image_url}`);
      
      // Extract filename from old URL
      const filename = product.image_url.split('/').pop();
      const newImageUrl = `https://tmyxjsqhtxnuchmekbpt.supabase.co/storage/v1/object/public/product-images/${filename}`;
      
      console.log(`  New: ${newImageUrl}`);
      
      // Check if file exists in product-images bucket
      try {
        const { data: files } = await supabase
          .storage
          .from('product-images')
          .list('', { limit: 1000 });

        const fileExists = files?.some(f => f.name === filename);
        if (fileExists) {
          console.log(`  ✅ File exists in product-images\n`);
        } else {
          // Copy from old bucket to new bucket if needed
          console.log(`  ⚠️  File not found in product-images - need to copy\n`);
        }
      } catch (err) {
        console.error(`  ❌ Error checking file:`, err.message);
      }
    }

    console.log('='.repeat(80) + '\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
