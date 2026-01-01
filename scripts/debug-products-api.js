#!/usr/bin/env node

/**
 * Debug script to test the products API directly
 * This queries Supabase directly to see what's being returned
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNoY3J6Y2UiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMzMxNzk4OCwiZXhwIjozNzQ5NjE3OTg4fQ.Zl4fNDJ_gXhTx6mYj9V5fN7F3t8-4BYGQe1UWQXwqfI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugProductsAPI() {
  console.log('================================================================================');
  console.log('🔍 DEBUG: PRODUCTS API QUERY');
  console.log('================================================================================\n');

  try {
    console.log('📋 Querying products with all fields...\n');

    const baseSelect = 'id, title, slug, vendor_id, base_price, currency, description, ribbon_text, image_url, gallery_images, is_published, created_at';
    
    const { data, error, status } = await supabase
      .from('products')
      .select(baseSelect)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log(`API Response Status: ${status}`);
    
    if (error) {
      console.error('❌ API Error:', error.message || error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No products found in database!');
      return;
    }

    console.log(`✅ Found ${data.length} products\n`);

    data.forEach((product, i) => {
      console.log(`\n📦 Product ${i + 1}:`);
      console.log(`  ├─ ID: ${product.id}`);
      console.log(`  ├─ Title: ${product.title || '❌ MISSING'}`);
      console.log(`  ├─ Slug: ${product.slug}`);
      console.log(`  ├─ Vendor ID: ${product.vendor_id}`);
      console.log(`  ├─ Base Price: ${product.base_price || '❌ MISSING'} (cents)`);
      console.log(`  ├─ Currency: ${product.currency || '❌ MISSING'}`);
      console.log(`  ├─ Description: ${product.description ? product.description.substring(0, 50) + '...' : '(none)'}`);
      console.log(`  ├─ Ribbon Text: ${product.ribbon_text || '(none)'}`);
      console.log(`  ├─ Image URL: ${product.image_url ? product.image_url.substring(0, 50) + '...' : '❌ MISSING'}`);
      console.log(`  ├─ Gallery Images: ${Array.isArray(product.gallery_images) ? product.gallery_images.length + ' images' : 'none'}`);
      console.log(`  ├─ Published: ${product.is_published}`);
      console.log(`  └─ Created: ${product.created_at}`);
    });

    console.log('\n================================================================================');
    console.log('✅ API QUERY DEBUG COMPLETE');
    console.log('================================================================================\n');

  } catch (err) {
    console.error('❌ Error:', err.message || err);
  }
}

debugProductsAPI();
