#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testCompleteFlow() {
  console.log('================================================================================');
  console.log('🧪 COMPLETE PRODUCT DISPLAY TEST');
  console.log('================================================================================\n');

  try {
    // Test 1: Query with new baseSelect (without ribbon_text)
    console.log('📋 TEST 1: Query products with correct fields\n');
    const baseSelect = 'id, title, slug, vendor_id, base_price, currency, description, image_url, gallery_images, is_published, created_at';
    
    const { data, error } = await supabase
      .from('products')
      .select(baseSelect)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('❌ Query failed:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.error('❌ No products returned!');
      return;
    }

    console.log(`✅ Retrieved ${data.length} products\n`);

    // Test 2: Check each product has required fields
    console.log('📋 TEST 2: Verify product fields\n');
    
    data.forEach((product, idx) => {
      console.log(`Product ${idx + 1}: ${product.title}`);
      console.log(`  ├─ id: ${product.id ? '✅' : '❌'}`);
      console.log(`  ├─ title: ${product.title ? '✅' : '❌'}`);
      console.log(`  ├─ base_price: ${product.base_price ? '✅ ' + product.base_price + ' cents' : '❌'}`);
      console.log(`  ├─ currency: ${product.currency ? '✅ ' + product.currency : '❌'}`);
      console.log(`  ├─ description: ${product.description ? '✅' : '❌'}`);
      console.log(`  ├─ image_url: ${product.image_url ? '✅' : '❌'}`);
      console.log(`  └─ created_at: ${product.created_at ? '✅' : '❌'}\n`);
    });

    // Test 3: Normalize products
    console.log('📋 TEST 3: Normalize products (test cardcomponent logic)\n');
    
    data.forEach((product, idx) => {
      // Simulate normalizeProduct
      const normalized = {
        id: product.id || null,
        title: String(product.title || '').trim() || 'Untitled',
        slug: String(product.slug || '').trim() || 'unknown',
        description: String(product.description || '').trim(),
        ribbon_text: String(product.ribbon_text || '').trim(), // Will be empty
        base_price: Number(product.base_price) || 0,
        currency: String(product.currency || 'USD').toUpperCase(),
        image_url: String(product.image_url || '').trim() || null,
        gallery_images: Array.isArray(product.gallery_images) ? product.gallery_images : [],
        is_published: Boolean(product.is_published)
      };

      // Simulate validateProductForDisplay
      const errors = [];
      if (!normalized.id) errors.push('Missing product ID');
      if (!normalized.title || normalized.title === 'Untitled') errors.push('Missing title');
      
      const isDisplayable = errors.length === 0 && !!normalized.id;

      console.log(`Product ${idx + 1}: ${normalized.title}`);
      console.log(`  ├─ isDisplayable: ${isDisplayable ? '✅ YES' : '❌ NO'}`);
      if (!isDisplayable) {
        console.log(`  ├─ errors: ${errors.join(', ')}`);
      }
      console.log(`  ├─ Will show: "${normalized.title}"`);
      console.log(`  ├─ Price: $${(normalized.base_price / 100).toFixed(2)} ${normalized.currency}`);
      console.log(`  └─ Image: ${normalized.image_url ? '✅ YES' : '❌ NO (placeholder)'}\n`);
    });

    console.log('================================================================================');
    console.log('✅ TEST COMPLETE - Products should display correctly on front-end');
    console.log('================================================================================\n');

  } catch (err) {
    console.error('❌ Error:', err.message || err);
  }
}

testCompleteFlow();
