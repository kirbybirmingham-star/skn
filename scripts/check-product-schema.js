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

async function checkProductSchema() {
  console.log('================================================================================');
  console.log('🔍 CHECK: PRODUCT TABLE SCHEMA');
  console.log('================================================================================\n');

  try {
    // Query 1 product to see what fields are returned
    console.log('Querying first product with ALL fields (using *):\n');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Query error:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No products found in database');
      return;
    }

    const product = data[0];
    console.log('✅ Available fields on products table:\n');

    const fields = Object.keys(product);
    fields.forEach((field, i) => {
      const value = product[field];
      const type = typeof value;
      const display = 
        value === null ? '(null)' :
        type === 'string' && value.length > 60 ? value.substring(0, 50) + '...' :
        value;
      
      console.log(`  ${i + 1}. ${field}: ${type}`);
      console.log(`     Value: ${display}`);
    });

    console.log('\n================================================================================');
    console.log('📋 FIELD CHECK\n');

    // Check for critical fields
    const criticalFields = ['id', 'title', 'slug', 'vendor_id', 'base_price', 'currency', 'description', 'ribbon_text', 'image_url', 'gallery_images'];
    const presentFields = criticalFields.filter(f => fields.includes(f));
    const missingFields = criticalFields.filter(f => !fields.includes(f));

    console.log(`✅ Present (${presentFields.length}): ${presentFields.join(', ')}`);
    if (missingFields.length > 0) {
      console.log(`❌ MISSING (${missingFields.length}): ${missingFields.join(', ')}`);
    }

    console.log('\n================================================================================');
    console.log('📊 PRODUCT SAMPLE\n');

    console.log('Full product object:');
    console.log(JSON.stringify(product, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message || err);
  }
}

checkProductSchema();
