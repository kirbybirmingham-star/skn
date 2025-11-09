
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: 'd:/WOrkspaces/SKNbridgetrade/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const seedData = {
  profiles: [
    { email: 'seller1@example.com', full_name: 'John Doe', role: 'seller' },
    { email: 'seller2@example.com', full_name: 'Jane Smith', role: 'seller' },
    { email: 'buyer1@example.com', full_name: 'Peter Jones', role: 'buyer' },
    { email: 'buyer2@example.com', full_name: 'Mary Williams', role: 'buyer' },
    { email: 'buyer3@example.com', full_name: 'David Brown', role: 'buyer' },
  ],
  vendors: [
    { name: 'Johns General Store', slug: 'johns-general-store', description: 'A little bit of everything' },
    { name: 'Janes Gadgets', slug: 'janes-gadgets', description: 'The latest and greatest gadgets' },
  ],
  categories: [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Clothing', slug: 'clothing' },
    { name: 'Home Goods', slug: 'home-goods' },
  ],
  products: [
    { 
      title: 'Laptop', 
      slug: 'laptop', 
      description: 'A powerful laptop', 
      base_price: 120000, 
      currency: 'USD', 
      is_published: true,
      image_url: 'https://supabase.co/storage/v1/object/public/listings-images/laptop.jpg',
      gallery_images: [
        'https://supabase.co/storage/v1/object/public/listings-images/laptop-1.jpg',
        'https://supabase.co/storage/v1/object/public/listings-images/laptop-2.jpg'
      ]
    },
    { 
      title: 'T-Shirt', 
      slug: 't-shirt', 
      description: 'A comfortable t-shirt', 
      base_price: 2500, 
      currency: 'USD', 
      is_published: true,
      image_url: 'https://supabase.co/storage/v1/object/public/listings-images/t-shirt.jpg',
      gallery_images: [
        'https://supabase.co/storage/v1/object/public/listings-images/t-shirt-1.jpg',
        'https://supabase.co/storage/v1/object/public/listings-images/t-shirt-2.jpg'
      ]
    },
    { 
      title: 'Coffee Mug', 
      slug: 'coffee-mug', 
      description: 'A mug for your coffee', 
      base_price: 1500, 
      currency: 'USD', 
      is_published: true,
      image_url: 'https://supabase.co/storage/v1/object/public/listings-images/coffee-mug.jpg',
      gallery_images: [
        'https://supabase.co/storage/v1/object/public/listings-images/coffee-mug-1.jpg',
        'https://supabase.co/storage/v1/object/public/listings-images/coffee-mug-2.jpg'
      ]
    },
    { 
      title: 'Smartphone', 
      slug: 'smartphone', 
      description: 'A smart smartphone', 
      base_price: 80000, 
      currency: 'USD', 
      is_published: true,
      image_url: 'https://supabase.co/storage/v1/object/public/listings-images/smartphone.jpg',
      gallery_images: [
        'https://supabase.co/storage/v1/object/public/listings-images/smartphone-1.jpg',
        'https://supabase.co/storage/v1/object/public/listings-images/smartphone-2.jpg'
      ]
    },
    { 
      title: 'Jeans', 
      slug: 'jeans', 
      description: 'A pair of jeans', 
      base_price: 6000, 
      currency: 'USD', 
      is_published: true,
      image_url: 'https://supabase.co/storage/v1/object/public/listings-images/jeans.jpg',
      gallery_images: [
        'https://supabase.co/storage/v1/object/public/listings-images/jeans-1.jpg',
        'https://supabase.co/storage/v1/object/public/listings-images/jeans-2.jpg'
      ]
    }
  ]
};

async function main() {
  console.log('Starting to seed data...');

  // Note: This script doesn't create auth users. 
  // You should create them manually in Supabase and get their IDs.
  // For this script, we'll use placeholders for owner_id.
  // You should replace 'placeholder-seller-id-1' and 'placeholder-seller-id-2'
  // with the actual user IDs from Supabase auth.

  // Upsert profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .upsert(seedData.profiles, { onConflict: 'email' });

  if (profilesError) {
    console.error('Error seeding profiles:', profilesError);
    return;
  }
  console.log('Seeded profiles');

  // Get seller profiles to associate with vendors
  const { data: sellers, error: sellersError } = await supabase
    .from('profiles')
    .select('id, email')
    .in('role', ['seller']);

  if (sellersError) {
    console.error('Error fetching sellers:', sellersError);
    return;
  }

  if (sellers.length < 2) {
    console.error('Error: At least two seller profiles are needed to seed vendors.');
    return;
  }
  
  const seller1Id = sellers.find(s => s.email === 'seller1@example.com').id;
  const seller2Id = sellers.find(s => s.email === 'seller2@example.com').id;

  // Upsert vendors
  seedData.vendors[0].owner_id = seller1Id;
  seedData.vendors[1].owner_id = seller2Id;
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .upsert(seedData.vendors, { onConflict: 'slug' });

  if (vendorsError) {
    console.error('Error seeding vendors:', vendorsError);
    return;
  }
  console.log('Seeded vendors');

  // Upsert categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .upsert(seedData.categories, { onConflict: 'slug' });

  if (categoriesError) {
    console.error('Error seeding categories:', categoriesError);
    return;
  }
  console.log('Seeded categories');

  // Get vendor and category IDs for products
  const { data: allVendors, error: allVendorsError } = await supabase.from('vendors').select('id, slug');
  if (allVendorsError) {
    console.error('Error fetching vendors for products:', allVendorsError);
    return;
  }
  const { data: allCategories, error: allCategoriesError } = await supabase.from('categories').select('id, slug');
  if (allCategoriesError) {
    console.error('Error fetching categories for products:', allCategoriesError);
    return;
  }

  const vendor1Id = allVendors.find(v => v.slug === 'johns-general-store').id;
  const vendor2Id = allVendors.find(v => v.slug === 'janes-gadgets').id;
  const electronicsCatId = allCategories.find(c => c.slug === 'electronics').id;
  const clothingCatId = allCategories.find(c => c.slug === 'clothing').id;
  const homeGoodsCatId = allCategories.find(c => c.slug === 'home-goods').id;

  // Assign vendors and categories to products
  seedData.products[0].vendor_id = vendor2Id; // Laptop -> Janes Gadgets
  seedData.products[0].category_id = electronicsCatId;
  seedData.products[1].vendor_id = vendor1Id; // T-Shirt -> Johns General Store
  seedData.products[1].category_id = clothingCatId;
  seedData.products[2].vendor_id = vendor1Id; // Coffee Mug -> Johns General Store
  seedData.products[2].category_id = homeGoodsCatId;
  seedData.products[3].vendor_id = vendor2Id; // Smartphone -> Janes Gadgets
  seedData.products[3].category_id = electronicsCatId;
  seedData.products[4].vendor_id = vendor1Id; // Jeans -> Johns General Store
  seedData.products[4].category_id = clothingCatId;

  // Upsert products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .upsert(seedData.products, { onConflict: 'slug, vendor_id' });

  if (productsError) {
    console.error('Error seeding products:', productsError);
    return;
  }
  console.log('Seeded products');


  console.log('Finished seeding data.');
}

main().catch(console.error);
