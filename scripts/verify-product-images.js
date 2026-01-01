#!/usr/bin/env node
/**
 * Debug script to inspect:
 * 1. What product data is in the database
 * 2. What images exist in Supabase storage
 * 3. Verify image_url values match storage
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NjE3NzYsImV4cCI6MjA3ODUzNzc3Nn0.hvS1z7h5FcgRZr8xMu3xTMioOSb6wTzvfLUQj1JZC74';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk2MTc3NiwiZXhwIjoyMDc4NTM3Nzc2fQ.PHgHqHw7scZYL2VF5VVcfGTVwT7OJUo8kL094Lnzc8k';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 PRODUCT CARD DATA VERIFICATION');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. Get product data
    console.log('📦 FETCHING PRODUCTS FROM DATABASE...\n');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, base_price, currency, image_url, gallery_images, is_published, created_at')
      .limit(10);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }

    console.log(`✅ Got ${products?.length || 0} products\n`);

    if (products && products.length > 0) {
      console.log('📋 PRODUCT DATA STRUCTURE:\n');
      products.forEach((p, i) => {
        console.log(`${i + 1}. "${p.title}"`);
        console.log(`   ID: ${p.id}`);
        console.log(`   Price: ${p.base_price} ${p.currency}`);
        console.log(`   Image URL: ${p.image_url || '(none)'}`);
        console.log(`   Gallery Images: ${Array.isArray(p.gallery_images) ? p.gallery_images.length : 0} items`);
        console.log(`   Published: ${p.is_published}`);
        console.log('');
      });
    }

    // 2. Check storage buckets
    console.log('\n' + '='.repeat(80));
    console.log('💾 CHECKING STORAGE BUCKETS...\n');

    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    console.log(`✅ Found ${buckets?.length || 0} buckets:\n`);
    buckets?.forEach(bucket => {
      console.log(`  📂 ${bucket.name}`);
    });

    // 3. Check product-images bucket contents
    console.log('\n' + '='.repeat(80));
    console.log('🖼️  CHECKING PRODUCT-IMAGES BUCKET...\n');

    const { data: files, error: filesError } = await supabase
      .storage
      .from('product-images')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (filesError) {
      console.error('⚠️  Error listing files:', filesError.message);
    } else if (files && files.length > 0) {
      console.log(`✅ Found ${files.length} files in product-images bucket:\n`);
      files.slice(0, 15).forEach(file => {
        console.log(`  📄 ${file.name}`);
      });
      if (files.length > 15) {
        console.log(`  ... and ${files.length - 15} more files`);
      }
    } else {
      console.log('⚠️  No files in product-images bucket');
    }

    // 4. Verify image URLs vs storage
    console.log('\n' + '='.repeat(80));
    console.log('✔️  VERIFYING IMAGE URLS...\n');

    let validImages = 0;
    let missingImages = 0;

    for (const product of products || []) {
      if (product.image_url) {
        // Check if this is a storage URL or UUID
        if (product.image_url.includes('supabase') || product.image_url.includes('https')) {
          validImages++;
          console.log(`✅ ${product.title}: Has valid URL`);
        } else {
          // Could be a UUID reference
          console.log(`ℹ️  ${product.title}: Has reference "${product.image_url.substring(0, 50)}..."`);
          validImages++;
        }
      } else {
        missingImages++;
        console.log(`❌ ${product.title}: No image_url`);
      }
    }

    console.log(`\n📊 Summary: ${validImages} with images, ${missingImages} missing\n`);

    // 5. Check if product image filenames in storage match any products
    console.log('='.repeat(80));
    console.log('🔗 MATCHING STORAGE FILES TO PRODUCTS...\n');

    if (files && files.length > 0 && products && products.length > 0) {
      const productIds = products.map(p => p.id);
      const matchedFiles = files.filter(f => productIds.some(id => f.name.includes(id)));
      console.log(`✅ Found ${matchedFiles.length} matching image files`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

main();
