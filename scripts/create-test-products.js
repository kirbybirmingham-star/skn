import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Check VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const testProducts = {
  'johns-general-store': [
    {
      title: 'Premium Coffee Beans',
      description: 'Freshly roasted Arabica coffee beans, perfect for your morning brew',
      base_price: 1850, // $18.50
      category_id: 1,
      product_variants: [
        {
          name: '1 lb Bag',
          price: 1850,
          inventory_quantity: 25,
          sku: 'COFFEE-1LB-JGS'
        },
        {
          name: '5 lb Bag',
          price: 8500,
          inventory_quantity: 10,
          sku: 'COFFEE-5LB-JGS'
        }
      ],
      images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500'],
      tags: ['coffee', 'beverages', 'premium'],
      is_published: true
    },
    {
      title: 'Organic Honey',
      description: 'Pure, raw honey from local beekeepers',
      base_price: 1250, // $12.50
      category_id: 1,
      product_variants: [
        {
          name: '16 oz Jar',
          price: 1250,
          inventory_quantity: 15,
          sku: 'HONEY-16OZ-JGS'
        },
        {
          name: '32 oz Jar',
          price: 2250,
          inventory_quantity: 8,
          sku: 'HONEY-32OZ-JGS'
        }
      ],
      images: ['https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=500'],
      tags: ['honey', 'organic', 'natural'],
      is_published: true
    },
    {
      title: 'Artisan Bread Loaf',
      description: 'Freshly baked sourdough bread made with organic flour',
      base_price: 650, // $6.50
      category_id: 1,
      product_variants: [
        {
          name: 'Sourdough - 1 lb',
          price: 650,
          inventory_quantity: 20,
          sku: 'BREAD-SOURDOUGH-JGS'
        }
      ],
      images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500'],
      tags: ['bread', 'bakery', 'organic'],
      is_published: true
    },
    {
      title: 'Gourmet Pasta Sauce',
      description: 'Homemade marinara sauce with fresh tomatoes and herbs',
      base_price: 850, // $8.50
      category_id: 1,
      product_variants: [
        {
          name: '24 oz Jar',
          price: 850,
          inventory_quantity: 12,
          sku: 'PASTA-SAUCE-JGS'
        }
      ],
      images: ['https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500'],
      tags: ['pasta', 'sauce', 'homemade'],
      is_published: true
    },
    {
      title: 'Fresh Salad Greens',
      description: 'Mixed organic greens harvested fresh daily',
      base_price: 450, // $4.50
      category_id: 1,
      product_variants: [
        {
          name: '1 lb Mix',
          price: 450,
          inventory_quantity: 18,
          sku: 'GREENS-MIX-JGS'
        }
      ],
      images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500'],
      tags: ['greens', 'salad', 'organic'],
      is_published: true
    }
  ],
  'janes-gadgets': [
    {
      title: 'Wireless Bluetooth Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      base_price: 8999, // $89.99
      category_id: 2,
      product_variants: [
        {
          name: 'Black',
          price: 8999,
          inventory_quantity: 8,
          sku: 'HEADPHONES-BLACK-JG'
        },
        {
          name: 'White',
          price: 8999,
          inventory_quantity: 6,
          sku: 'HEADPHONES-WHITE-JG'
        }
      ],
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
      tags: ['headphones', 'wireless', 'bluetooth'],
      is_published: true
    },
    {
      title: 'Smart Fitness Tracker',
      description: 'Advanced fitness tracker with heart rate monitoring',
      base_price: 12999, // $129.99
      category_id: 2,
      product_variants: [
        {
          name: 'Standard',
          price: 12999,
          inventory_quantity: 5,
          sku: 'FITNESS-TRACKER-JG'
        }
      ],
      images: ['https://images.unsplash.com/photo-1544117519-31a4b719223d?w=500'],
      tags: ['fitness', 'tracker', 'smart'],
      is_published: true
    },
    {
      title: 'Portable Power Bank',
      description: '20000mAh power bank for all your devices',
      base_price: 2999, // $29.99
      category_id: 2,
      product_variants: [
        {
          name: '20000mAh',
          price: 2999,
          inventory_quantity: 15,
          sku: 'POWERBANK-20K-JG'
        },
        {
          name: '10000mAh',
          price: 1999,
          inventory_quantity: 20,
          sku: 'POWERBANK-10K-JG'
        }
      ],
      images: ['https://images.unsplash.com/photo-1609594040184-44e9c75c0b6b?w=500'],
      tags: ['powerbank', 'portable', 'charging'],
      is_published: true
    },
    {
      title: 'Wireless Charging Pad',
      description: 'Fast wireless charging pad compatible with all Qi devices',
      base_price: 2499, // $24.99
      category_id: 2,
      product_variants: [
        {
          name: 'Standard',
          price: 2499,
          inventory_quantity: 12,
          sku: 'CHARGING-PAD-JG'
        }
      ],
      images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500'],
      tags: ['wireless', 'charging', 'qi'],
      is_published: true
    },
    {
      title: 'Bluetooth Speaker',
      description: 'Waterproof Bluetooth speaker with 360-degree sound',
      base_price: 4999, // $49.99
      category_id: 2,
      product_variants: [
        {
          name: 'Blue',
          price: 4999,
          inventory_quantity: 10,
          sku: 'SPEAKER-BLUE-JG'
        },
        {
          name: 'Black',
          price: 4999,
          inventory_quantity: 8,
          sku: 'SPEAKER-BLACK-JG'
        }
      ],
      images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500'],
      tags: ['speaker', 'bluetooth', 'waterproof'],
      is_published: true
    }
  ]
};

async function createTestProducts() {
  try {
    console.log('Starting to create test products...');

    // Get vendors
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, slug');

    if (vendorError) {
      console.error('Error fetching vendors:', vendorError);
      return;
    }

    console.log('Found vendors:', vendors);

    for (const vendor of vendors) {
      const vendorSlug = vendor.slug;
      const products = testProducts[vendorSlug];

      if (!products) {
        console.log(`No test products defined for vendor: ${vendorSlug}`);
        continue;
      }

      console.log(`Creating ${products.length} products for ${vendorSlug}...`);

      for (const productData of products) {
        try {
          // Create the main product
          const productPayload = {
            vendor_id: vendor.id,
            title: productData.title,
            description: productData.description,
            base_price: productData.base_price,
            category_id: productData.category_id,
            image_url: productData.images[0], // Use first image as main image
            tags: productData.tags,
            is_published: productData.is_published
          };

          const { data: product, error: productError } = await supabase
            .from('vendor_products')
            .insert([productPayload])
            .select()
            .single();

          if (productError) {
            console.error(`Error creating product ${productData.title}:`, productError);
            continue;
          }

          console.log(`✓ Created product: ${productData.title}`);
        } catch (err) {
          console.error(`Failed to create product ${productData.title}:`, err);
        }
      }
    }

    console.log('✅ Finished creating test products!');
  } catch (error) {
    console.error('Error in createTestProducts:', error);
  }
}

// Run the script
createTestProducts().then(() => {
  console.log('Script completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});