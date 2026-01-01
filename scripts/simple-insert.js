import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertSimpleProducts() {
  console.log('Inserting simple test products...');

  // Get vendor IDs
  const { data: vendors, error: vendorError } = await supabase
    .from('vendors')
    .select('id, slug');

  if (vendorError) {
    console.error('Error fetching vendors:', vendorError);
    return;
  }

  console.log('Found vendors:', vendors.map(v => ({ id: v.id, slug: v.slug })));

  // Simple products data
  const products = [
    {
      vendor_id: vendors[0].id, // First vendor
      title: 'Premium Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      base_price: 8999,
      is_published: true
    },
    {
      vendor_id: vendors[0].id,
      title: 'Organic Coffee Beans',
      description: 'Freshly roasted Arabica coffee beans',
      base_price: 1850,
      is_published: true
    },
    {
      vendor_id: vendors[1]?.id || vendors[0].id, // Second vendor or fallback
      title: 'Smart Fitness Tracker',
      description: 'Advanced fitness tracker with heart rate monitoring',
      base_price: 12999,
      is_published: true
    },
    {
      vendor_id: vendors[1]?.id || vendors[0].id,
      title: 'Bluetooth Speaker',
      description: 'Waterproof Bluetooth speaker with 360-degree sound',
      base_price: 4999,
      is_published: true
    },
    {
      vendor_id: vendors[2]?.id || vendors[0].id, // Third vendor or fallback
      title: 'Portable Power Bank',
      description: '20000mAh power bank for all your devices',
      base_price: 2999,
      is_published: true
    },
    {
      vendor_id: vendors[2]?.id || vendors[0].id,
      title: 'Wireless Charging Pad',
      description: 'Fast wireless charging pad compatible with all Qi devices',
      base_price: 2499,
      is_published: true
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const product of products) {
    try {
      const { data, error } = await supabase
        .from('vendor_products')
        .insert(product);

      if (error) {
        console.error(`Error inserting "${product.title}":`, error.message);
        errorCount++;
      } else {
        console.log(`✓ Inserted: ${product.title}`);
        successCount++;
      }
    } catch (err) {
      console.error(`Exception inserting "${product.title}":`, err.message);
      errorCount++;
    }
  }

  console.log(`\nResults: ${successCount} successful, ${errorCount} errors`);

  // Verify the insertions
  const { data: verifyProducts, error: verifyError } = await supabase
    .from('vendor_products')
    .select('title, vendor_id, is_published');

  if (!verifyError && verifyProducts) {
    console.log(`Total products in database: ${verifyProducts.length}`);
    console.log('Products:', verifyProducts.map(p => p.title));
  }
}

insertSimpleProducts().catch(console.error);