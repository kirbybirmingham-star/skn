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

async function testRLS() {
  console.log('================================================================================');
  console.log('🔍 TEST: RLS AND FIELD ACCESS');
  console.log('================================================================================\n');

  try {
    // Test 1: Query with specific fields
    console.log('TEST 1: Query with specific fields\n');
    const { data: specificFields, error: err1 } = await supabase
      .from('products')
      .select('id, title, base_price, currency')
      .limit(1);

    if (err1) {
      console.error('❌ Error:', err1.message);
    } else {
      console.log('✅ Got data:');
      console.log(JSON.stringify(specificFields, null, 2));
    }

    // Test 2: Query with wildcard (all fields)
    console.log('\n\nTEST 2: Query with * (all fields)\n');
    const { data: allFields, error: err2 } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (err2) {
      console.error('❌ Error:', err2.message);
    } else {
      console.log('✅ Got data:');
      console.log(JSON.stringify(allFields, null, 2));
    }

    // Test 3: Check if data is truly undefined or missing in response
    console.log('\n\nTEST 3: Check data structure\n');
    const { data: test3, error: err3 } = await supabase
      .from('products')
      .select('id, title, base_price, currency, description, image_url')
      .limit(1);

    if (err3) {
      console.error('❌ Error:', err3.message);
    } else if (test3 && test3.length > 0) {
      const product = test3[0];
      console.log('Product keys:', Object.keys(product));
      console.log('Product values:');
      Object.entries(product).forEach(([key, value]) => {
        console.log(`  ${key}: ${value === undefined ? 'undefined' : value === null ? 'null' : typeof value}`);
      });
    }

  } catch (err) {
    console.error('❌ Error:', err.message || err);
  }
}

testRLS();
