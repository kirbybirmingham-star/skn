import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugEverything() {
  try {
    console.log('🔍 COMPLETE DEBUG: Products, Storage, and Database State\n');

    // 1. Check products table structure
    console.log('=== PRODUCTS TABLE STRUCTURE ===');
    const { data: productColumns, error: structError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (structError) {
      console.error('Products structure error:', structError);
    } else if (productColumns && productColumns.length > 0) {
      console.log('Available columns:', Object.keys(productColumns[0]).join(', '));
    }

    // 2. Check products table
    console.log('\n=== PRODUCTS TABLE ===');
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*');

    if (prodError) console.error('Products error:', prodError);
    else {
      console.log('Products found:', products?.length || 0);
      products?.forEach(p => {
        const imageField = p.image_url || p.images || p.image_urls || 'NO IMAGE FIELD';
        console.log(`  ${p.title || p.name || 'NO TITLE'} - Image: ${imageField !== 'NO IMAGE FIELD' ? 'YES' : 'NO'} - Published: ${p.is_published || p.published || 'UNKNOWN'}`);
      });
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugEverything();