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
    description: 'High-quality wireless headphones with noise cancellation',
    base_price: 8999, // $89.99
    tags: ['headphones', 'wireless', 'audio'],
    is_published: true
  },
  {
    title: 'Organic Coffee Beans',
    description: 'Freshly roasted Arabica coffee beans, perfect for your morning brew',
    base_price: 1850, // $18.50
    tags: ['coffee', 'beverages', 'organic'],
    is_published: true
  },
  {
    title: 'Smart Fitness Tracker',
    description: 'Advanced fitness tracker with heart rate monitoring',
    base_price: 12999, // $129.99
    tags: ['fitness', 'tracker', 'smart'],
    is_published: true
  },
  {
    title: 'Portable Power Bank',
    description: '20000mAh power bank for all your devices',
    base_price: 2999, // $29.99
    tags: ['powerbank', 'portable', 'charging'],
    is_published: true
  },
  {
    title: 'Bluetooth Speaker',
    description: 'Waterproof Bluetooth speaker with 360-degree sound',
    base_price: 4999, // $49.99
    tags: ['speaker', 'bluetooth', 'waterproof'],
    is_published: true
  },
  {
    title: 'Organic Honey',
    description: 'Pure, raw honey from local beekeepers',
    base_price: 1250, // $12.50
    tags: ['honey', 'organic', 'natural'],
    is_published: true
  },
  {
    title: 'Artisan Bread Loaf',
    description: 'Freshly baked sourdough bread made with organic flour',
    base_price: 650, // $6.50
    tags: ['bread', 'bakery', 'organic'],
    is_published: true
  },
  {
    title: 'Gourmet Pasta Sauce',
    description: 'Homemade marinara sauce with fresh tomatoes and herbs',
    base_price: 850, // $8.50
    tags: ['pasta', 'sauce', 'homemade'],
    is_published: true
  }
];

async function main() {
  console.log('Creating basic test products...');

  // Get the first vendor
  const { data: vendors, error: vendorError } = await supabase
    .from('vendors')
    .select('id')
    .limit(1);

  if (vendorError || !vendors || vendors.length === 0) {
    console.error('No vendors found. Please run vendor seeding first.');
    process.exit(1);
  }

  const vendorId = vendors[0].id;
  console.log(`Using vendor ID: ${vendorId}`);

  let createdCount = 0;

  for (const product of products) {
    try {
      // Try inserting with minimal fields first
      const { data, error } = await supabase
        .from('vendor_products')
        .insert({
          vendor_id: vendorId,
          title: product.title,
          description: product.description,
          base_price: product.base_price,
          tags: product.tags,
          is_published: product.is_published,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating product "${product.title}":`, error.message);
      } else {
        console.log(`✓ Created: ${product.title}`);
        createdCount++;
      }
    } catch (err) {
      console.error(`Failed to create product "${product.title}":`, err.message);
    }
  }

  console.log(`\n✅ Successfully created ${createdCount} test products!`);
  console.log('Your marketplace should now have products to display.');

  // Verify products were created
  const { data: verifyProducts, error: verifyError } = await supabase
    .from('vendor_products')
    .select('*')
    .limit(10);

  if (!verifyError && verifyProducts) {
    console.log(`\nVerification: Found ${verifyProducts.length} products in database`);
  }
}

main().catch(console.error);