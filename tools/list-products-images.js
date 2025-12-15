#!/usr/bin/env node
/**
 * List all products and their image status
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listProducts() {
  try {
    console.log('📦 Fetching products...\n');

    // Query from vendor_products view (what the app uses)
    const { data, error } = await supabase
      .from('vendor_products')
      .select('id, title, slug, image_url')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('ℹ️  No products found');
      process.exit(0);
    }

    const withImages = data.filter(p => p.image_url && p.image_url.length > 0);
    const missing = data.filter(p => !p.image_url || p.image_url.length === 0);

    console.log(`📊 Summary`);
    console.log(`===========`);
    console.log(`Total products: ${data.length}`);
    console.log(`With images: ${withImages.length}`);
    console.log(`Missing images: ${missing.length}\n`);

    if (missing.length > 0) {
      console.log(`🔍 Products Missing Images:`);
      console.log(`----------------------------`);
      missing.forEach((p, i) => {
        console.log(`${i + 1}. ${p.title || p.slug || p.id}`);
      });
    }

    console.log(`\n💾 Full data saved to products.json`);
    const fs = await import('fs').then(m => m.default);
    fs.writeFileSync('products.json', JSON.stringify({ total: data.length, withImages: withImages.length, missing: missing.length, products: data }, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

listProducts();
