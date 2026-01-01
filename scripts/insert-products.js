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

const products = [
  {
    title: 'Premium Wireless Headphones',
    slug: 'premium-wireless-headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    base_price: 8999,
    currency: 'USD',
    is_published: true
  },
  {
    title: 'Organic Coffee Beans',
    slug: 'organic-coffee-beans',
    description: 'Freshly roasted Arabica coffee beans',
    base_price: 1850,
    currency: 'USD',
    is_published: true
  },
  {
    title: 'Smart Fitness Tracker',
    slug: 'smart-fitness-tracker',
    description: 'Advanced fitness tracker with heart rate monitoring',
    base_price: 12999,
    currency: 'USD',
    is_published: true
  },
  {
    title: 'Portable Power Bank',
    slug: 'portable-power-bank',
    description: '20000mAh power bank for all your devices',
    base_price: 2999,
    currency: 'USD',
    is_published: true
  },
  {
    title: 'Bluetooth Speaker',
    slug: 'bluetooth-speaker',
    description: 'Waterproof Bluetooth speaker with 360-degree sound',
    base_price: 4999,
    currency: 'USD',
    is_published: true
  },
  {
    title: 'Organic Honey',
    slug: 'organic-honey',
    description: 'Pure, raw honey from local beekeepers',
    base_price: 1250,
    currency: 'USD',
    is_published: true
  },
  {
    title: 'Artisan Bread Loaf',
    slug: 'artisan-bread-loaf',
    description: 'Freshly baked sourdough bread made with organic flour',
    base_price: 650,
    currency: 'USD',
    is_published: true
  },
  {
    title: 'Gourmet Pasta Sauce',
    slug: 'gourmet-pasta-sauce',
    description: 'Homemade marinara sauce with fresh tomatoes and herbs',
    base_price: 850,
    currency: 'USD',
    is_published: true
  }
];

async function insertProducts() {
  console.log('Inserting products into the products table...');

  // Get vendors
  const { data: vendors, error: vendorError } = await supabase
    .from('vendors')
    .select('id, slug');

  if (vendorError || !vendors || vendors.length === 0) {
    console.error('No vendors found. Please run vendor seeding first.');
    process.exit(1);
  }

  console.log(`Found ${vendors.length} vendors:`, vendors.map(v => v.slug));

  let successCount = 0;
  let errorCount = 0;

  // Distribute products across vendors
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const vendorIndex = i % vendors.length; // Round-robin distribution
    const vendor = vendors[vendorIndex];

    const productData = {
      ...product,
      vendor_id: vendor.id
    };

    try {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        console.error(`Error inserting "${product.title}" into vendor "${vendor.slug}":`, error.message);
        errorCount++;
      } else {
        console.log(`✓ Inserted "${product.title}" into vendor "${vendor.slug}"`);
        successCount++;
      }
    } catch (err) {
      console.error(`Exception inserting "${product.title}":`, err.message);
      errorCount++;
    }
  }

  console.log(`\nResults: ${successCount} successful insertions, ${errorCount} errors`);

  // Verify insertions
  const { data: verifyProducts, error: verifyError } = await supabase
    .from('products')
    .select('title, vendor_id, is_published');

  if (!verifyError && verifyProducts) {
    console.log(`\nVerification: Total products in database: ${verifyProducts.length}`);
    verifyProducts.forEach(p => console.log(`  - ${p.title} (published: ${p.is_published})`));
  } else {
    console.error('Error verifying products:', verifyError?.message);
  }

  console.log('\n✅ Product insertion complete!');
  console.log('Your marketplace should now display products.');
}

insertProducts().catch(console.error);