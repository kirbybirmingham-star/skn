import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in repo root
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const seedData = {
  // Define test users with consistent password
  users: [
    { email: 'seller1@example.com', password: 'test1234', full_name: 'John Doe', role: 'seller' },
    { email: 'seller2@example.com', password: 'test1234', full_name: 'Jane Smith', role: 'seller' },
    { email: 'buyer1@example.com', password: 'test1234', full_name: 'Peter Jones', role: 'buyer' },
    { email: 'buyer2@example.com', password: 'test1234', full_name: 'Mary Williams', role: 'buyer' },
    { email: 'buyer3@example.com', password: 'test1234', full_name: 'David Brown', role: 'buyer' },
  ],
  vendors: [
    { 
      business_name: 'Johns General Store',
      slug: 'johns-general-store',
      description: 'A little bit of everything',
      status: 'active',
      verification_status: 'verified',
      kyc_verified: true,
      kyb_verified: true,
      business_type: 'sole_proprietorship',
      tax_id: '123-45-6789',
      commission_rate: 10.00,
      minimum_payout: 100.00,
      payout_method: 'bank_transfer',
      onboarding_step: 'completed',
      onboarding_completed: true
    },
    { 
      business_name: 'Janes Gadgets',
      slug: 'janes-gadgets',
      description: 'The latest and greatest gadgets',
      status: 'active',
      verification_status: 'verified',
      kyc_verified: true,
      kyb_verified: true,
      business_type: 'llc',
      tax_id: '987-65-4321',
      commission_rate: 12.00,
      minimum_payout: 50.00,
      payout_method: 'paypal',
      onboarding_step: 'completed',
      onboarding_completed: true
    },
  ],
  products: [
    { 
      title: 'Laptop',
      slug: 'laptop',
      description: 'A powerful laptop',
      base_price: 120000,
      currency: 'USD',
      is_published: true,
      has_variants: true,
      stock_tracking: true,
      low_stock_alert: 5,
      shipping_class: 'large',
      shipping_weight: 2.5,
      category: 'electronics',
      tags: ['laptop', 'computer', 'electronics'],
      images: [
        'https://supabase.co/storage/v1/object/public/listings-images/laptop.jpg'
      ],
      gallery_images: [
        'https://supabase.co/storage/v1/object/public/listings-images/laptop-1.jpg',
        'https://supabase.co/storage/v1/object/public/listings-images/laptop-2.jpg'
      ],
      variants: [
        {
          name: '8GB RAM / 256GB SSD',
          sku: 'LAP-8-256',
          price: 120000,
          stock_level: 10
        },
        {
          name: '16GB RAM / 512GB SSD',
          sku: 'LAP-16-512',
          price: 150000,
          stock_level: 5
        }
      ],
      variant_options: [
        {
          name: 'Configuration',
          type: 'select',
          required: true,
          options: {
            choices: [
              '8GB RAM / 256GB SSD',
              '16GB RAM / 512GB SSD'
            ]
          }
        }
      ]
    },
    { 
      title: 'T-Shirt',
      slug: 't-shirt',
      description: 'A comfortable t-shirt',
      base_price: 2500,
      currency: 'USD',
      is_published: true,
      has_variants: true,
      stock_tracking: true,
      low_stock_alert: 10,
      shipping_class: 'small',
      shipping_weight: 0.2,
      category: 'clothing',
      tags: ['t-shirt', 'clothing', 'apparel'],
      images: [
        'https://supabase.co/storage/v1/object/public/listings-images/t-shirt.jpg'
      ],
      gallery_images: [
        'https://supabase.co/storage/v1/object/public/listings-images/t-shirt-1.jpg',
        'https://supabase.co/storage/v1/object/public/listings-images/t-shirt-2.jpg'
      ],
      variants: [
        {
          name: 'Small / Black',
          sku: 'TS-BLK-S',
          price: 2500,
          stock_level: 20
        },
        {
          name: 'Medium / Black',
          sku: 'TS-BLK-M',
          price: 2500,
          stock_level: 15
        },
        {
          name: 'Large / Black',
          sku: 'TS-BLK-L',
          price: 2500,
          stock_level: 15
        }
      ],
      variant_options: [
        {
          name: 'Size',
          type: 'select',
          required: true,
          options: {
            choices: ['Small', 'Medium', 'Large']
          }
        },
        {
          name: 'Color',
          type: 'select',
          required: true,
          options: {
            choices: ['Black', 'White', 'Gray']
          }
        }
      ]
    },
    {
      title: 'Coffee Mug',
      slug: 'coffee-mug',
      description: 'A mug for your coffee',
      base_price: 1500,
      currency: 'USD',
      is_published: true,
      has_variants: true,
      stock_tracking: true,
      low_stock_alert: 15,
      shipping_class: 'small',
      shipping_weight: 0.5,
      category: 'home-goods',
      tags: ['mug', 'coffee', 'kitchen'],
      images: [
        'https://supabase.co/storage/v1/object/public/listings-images/coffee-mug.jpg'
      ],
      gallery_images: [
        'https://supabase.co/storage/v1/object/public/listings-images/coffee-mug-1.jpg',
        'https://supabase.co/storage/v1/object/public/listings-images/coffee-mug-2.jpg'
      ],
      variants: [
        {
          name: 'Classic / White',
          sku: 'MUG-WHT',
          price: 1500,
          stock_level: 25
        },
        {
          name: 'Classic / Black',
          sku: 'MUG-BLK',
          price: 1500,
          stock_level: 25
        }
      ],
      variant_options: [
        {
          name: 'Color',
          type: 'select',
          required: true,
          options: {
            choices: ['White', 'Black']
          }
        }
      ]
    },
    {
      title: 'Smartphone',
      slug: 'smartphone',
      description: 'A smart smartphone',
      base_price: 80000,
      currency: 'USD',
      is_published: true,
      has_variants: true,
      stock_tracking: true,
      low_stock_alert: 5,
      shipping_class: 'small',
      shipping_weight: 0.3,
      category: 'electronics',
      tags: ['phone', 'smartphone', 'electronics'],
      images: [
        'https://supabase.co/storage/v1/object/public/listings-images/smartphone.jpg'
      ],
      gallery_images: [
        'https://supabase.co/storage/v1/object/public/listings-images/smartphone-1.jpg',
        'https://supabase.co/storage/v1/object/public/listings-images/smartphone-2.jpg'
      ],
      variants: [
        {
          name: '128GB / Black',
          sku: 'PHN-128-BLK',
          price: 80000,
          stock_level: 8
        },
        {
          name: '256GB / Black',
          sku: 'PHN-256-BLK',
          price: 90000,
          stock_level: 5
        }
      ],
      variant_options: [
        {
          name: 'Storage',
          type: 'select',
          required: true,
          options: {
            choices: ['128GB', '256GB']
          }
        },
        {
          name: 'Color',
          type: 'select',
          required: true,
          options: {
            choices: ['Black', 'Silver']
          }
        }
      ]
    },
    {
      title: 'Jeans',
      slug: 'jeans',
      description: 'A pair of jeans',
      base_price: 6000,
      currency: 'USD',
      is_published: true,
      has_variants: true,
      stock_tracking: true,
      low_stock_alert: 10,
      shipping_class: 'small',
      shipping_weight: 0.8,
      category: 'clothing',
      tags: ['jeans', 'clothing', 'apparel'],
      images: [
        'https://supabase.co/storage/v1/object/public/listings-images/jeans.jpg'
      ],
      gallery_images: [
        'https://supabase.co/storage/v1/object/public/listings-images/jeans-1.jpg',
        'https://supabase.co/storage/v1/object/public/listings-images/jeans-2.jpg'
      ],
      variants: [
        {
          name: '30x32 / Blue',
          sku: 'JNS-30-32-BLU',
          price: 6000,
          stock_level: 12
        },
        {
          name: '32x32 / Blue',
          sku: 'JNS-32-32-BLU',
          price: 6000,
          stock_level: 15
        },
        {
          name: '34x32 / Blue',
          sku: 'JNS-34-32-BLU',
          price: 6000,
          stock_level: 10
        }
      ],
      variant_options: [
        {
          name: 'Size',
          type: 'select',
          required: true,
          options: {
            choices: ['30x32', '32x32', '34x32']
          }
        },
        {
          name: 'Color',
          type: 'select',
          required: true,
          options: {
            choices: ['Blue', 'Black']
          }
        }
      ]
    }
  ],
  sample_orders: [
    {
      status: 'completed',
      total_amount: 150000,
      payment_status: 'paid',
      payment_method: 'credit_card',
      payment_intent_id: 'pi_sample_1',
      fulfillment_status: 'delivered',
      tracking_number: '1Z999AA1234567890',
      shipping_method: 'express',
      shipping_address: {
        name: 'Peter Jones',
        address1: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postal_code: '12345',
        country: 'US'
      },
      billing_address: {
        name: 'Peter Jones',
        address1: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postal_code: '12345',
        country: 'US'
      },
      items: [
        {
          quantity: 1,
          unit_price: 150000
        }
      ]
    }
  ]
};

async function createAuthUser(userData) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: { 
        full_name: userData.full_name,
        role: userData.role
      },
      email_confirm: true
    });

    if (error) throw error;
    if (!data?.user) throw new Error('No user data returned');
    return data.user;
  } catch (err) {
    console.error(`Error creating auth user ${userData.email}:`, err.message);
    throw err;
  }
}

async function main() {
  console.log('Starting to seed data...');

  // Step 1: Create auth users and their profiles
  console.log('\nCreating auth users and profiles...');
  const profiles = [];
  
  for (const userData of seedData.users) {
    try {
      const authUser = await createAuthUser(userData);
      console.log(`✓ Created auth user ${userData.email} (${authUser.id})`);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: userData.email,
          full_name: userData.full_name,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        console.error(`Error creating profile for ${userData.email}:`, profileError);
        continue;
      }

      console.log(`✓ Created profile for ${userData.email}`);
      profiles.push({ ...profile, role: userData.role });
      
    } catch (err) {
      console.error(`Failed to process user ${userData.email}:`, err.message);
    }
  }

  // Step 2: Create vendors for sellers
  console.log('\nCreating vendors...');
  const sellers = profiles.filter(p => p.role === 'seller');
  
  for (let i = 0; i < Math.min(sellers.length, seedData.vendors.length); i++) {
    const vendor = seedData.vendors[i];
    const seller = sellers[i];
    
    const { data, error } = await supabase
      .from('vendors')
      .insert({
        business_name: vendor.business_name,
        slug: vendor.slug,
        description: vendor.description,
        owner_id: seller.id,
        status: vendor.status,
        verification_status: vendor.verification_status,
        kyc_verified: vendor.kyc_verified,
        kyb_verified: vendor.kyb_verified,
        business_type: vendor.business_type,
        tax_id: vendor.tax_id,
        commission_rate: vendor.commission_rate,
        minimum_payout: vendor.minimum_payout,
        payout_method: vendor.payout_method,
        onboarding_step: vendor.onboarding_step,
        onboarding_completed: vendor.onboarding_completed,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating vendor for ${seller.email}:`, error);
      continue;
    }
    console.log(`✓ Created vendor: ${vendor.business_name}`);
    seedData.vendors[i].id = data.id;
  }

  // Step 3: Create products with variants
  console.log('\nCreating products...');
  for (const product of seedData.products) {
    // Assign to first vendor for simplicity
    const vendorId = seedData.vendors[0].id;
    
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        vendor_id: vendorId,
        title: product.title,
        slug: product.slug,
        description: product.description,
        base_price: product.base_price,
        currency: product.currency,
        images: product.images,
        gallery_images: product.gallery_images,
        status: product.is_published ? 'active' : 'draft',
        category: product.category,
        has_variants: product.has_variants,
        stock_tracking: product.stock_tracking,
        low_stock_alert: product.low_stock_alert,
        shipping_class: product.shipping_class,
        shipping_weight: product.shipping_weight,
        tags: product.tags,
        has_variants: product.has_variants,
        stock_tracking: product.stock_tracking,
        low_stock_alert: product.low_stock_alert,
        shipping_class: product.shipping_class,
        shipping_weight: product.shipping_weight,
        category: product.category,
        tags: product.tags,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (productError) {
      console.error(`Error creating product ${product.name}:`, productError);
      continue;
    }

    console.log(`✓ Created product: ${product.name}`);

    // Create variants if any
    if (product.variants) {
      for (const variant of product.variants) {
        const { error: variantError } = await supabase
          .from('product_variants')
          .insert({
            product_id: productData.id,
            ...variant,
            created_at: new Date().toISOString()
          });

        if (variantError) {
          console.error(`Error creating variant for ${product.name}:`, variantError);
        }
      }
      console.log(`✓ Created variants for: ${product.name}`);
    }

    // Create variant options if any
    if (product.variant_options) {
      for (const option of product.variant_options) {
        const { error: optionError } = await supabase
          .from('variant_options')
          .insert({
            product_id: productData.id,
            ...option,
            created_at: new Date().toISOString()
          });

        if (optionError) {
          console.error(`Error creating variant option for ${product.name}:`, optionError);
        }
      }
      console.log(`✓ Created variant options for: ${product.name}`);
    }
  }

  // Step 4: Create sample orders
  console.log('\nCreating sample orders...');
  const buyers = profiles.filter(p => p.role === 'buyer');
  
  if (buyers.length > 0) {
    for (const orderData of seedData.sample_orders) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: buyers[0].id,
          vendor_id: seedData.vendors[0].id,
          ...orderData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating sample order:', orderError);
        continue;
      }

      // Create order items
      for (const item of orderData.items) {
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: seedData.products[0].id, // Use first product for simplicity
            ...item,
            created_at: new Date().toISOString()
          });

        if (itemError) {
          console.error('Error creating order item:', itemError);
        }
      }
      console.log('✓ Created sample order with items');
    }
  }

  console.log('\n✨ Finished seeding data successfully!');
  console.log('\nTest users created (all with password: test1234):');
  seedData.users.forEach(u => console.log(`- ${u.email} (${u.role})`));
}

main().catch(console.error);