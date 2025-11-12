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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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

async function createAuthUser(userData) {
  try {
    // Check if user exists first
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      console.log(`User ${userData.email} already exists, skipping...`);
      return existingUser;
    }

    // Create user via signup
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role
        }
      }
    });

    if (error) throw error;
    if (!data?.user) throw new Error('No user data returned');

    // Wait briefly for the auth user to be created
    await new Promise(resolve => setTimeout(resolve, 1000));

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
      // Create auth user first (this gives us the ID we need)
      const authUser = await createAuthUser(userData);
      console.log(`✓ Created auth user ${userData.email} (${authUser.id})`);
      
      // Now create the profile using the auth user's ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,  // Must match auth.users.id
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role
        })
        .select()
        .single();

      if (profileError) {
        console.error(`Error creating profile for ${userData.email}:`, profileError);
        continue;
      }

      console.log(`✓ Created profile for ${userData.email}`);
      profiles.push(profile);
      
    } catch (err) {
      console.error(`Failed to process user ${userData.email}:`, err.message);
    }
  }

  // Get seller profiles from the ones we just created
  const sellers = profiles.filter(p => p.role === 'seller');
  if (sellers.length < 2) {
    console.error('Error: At least two seller profiles are needed to seed vendors.');
    return;
  }
  
  const seller1 = sellers.find(s => s.email === 'seller1@example.com');
  const seller2 = sellers.find(s => s.email === 'seller2@example.com');

  // Upsert vendors
  if (!seller1 || !seller2) {
    console.error('Error: Could not find required seller profiles');
    return;
  }

  // Step 3: Create vendors
  console.log('\nCreating vendors...');
  seedData.vendors[0].owner_id = seller1.id;
  seedData.vendors[1].owner_id = seller2.id;
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .upsert(seedData.vendors, { onConflict: 'slug' });

  if (vendorsError) {
    console.error('Error seeding vendors:', vendorsError);
    return;
  }
  console.log('✓ Created vendors');

  // Step 4: Create categories
  console.log('\nCreating categories...');
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .upsert(seedData.categories, { onConflict: 'slug' });

  if (categoriesError) {
    console.error('Error seeding categories:', categoriesError);
    return;
  }
  console.log('✓ Created categories');

  // Step 5: Get vendor and category IDs for products
  const { data: allVendors } = await supabase.from('vendors').select('id, slug');
  const { data: allCategories } = await supabase.from('categories').select('id, slug');

  const vendor1 = allVendors.find(v => v.slug === 'johns-general-store');
  const vendor2 = allVendors.find(v => v.slug === 'janes-gadgets');
  const electronics = allCategories.find(c => c.slug === 'electronics');
  const clothing = allCategories.find(c => c.slug === 'clothing');
  const homeGoods = allCategories.find(c => c.slug === 'home-goods');

  if (!vendor1 || !vendor2 || !electronics || !clothing || !homeGoods) {
    console.error('Error: Missing required vendors or categories');
    return;
  }

  // Step 6: Create products
  console.log('\nCreating products...');
  const productsWithRefs = [
    { ...seedData.products[0], vendor_id: vendor2.id, category_id: electronics.id }, // Laptop -> Janes
    { ...seedData.products[1], vendor_id: vendor1.id, category_id: clothing.id },    // T-Shirt -> Johns
    { ...seedData.products[2], vendor_id: vendor1.id, category_id: homeGoods.id },   // Mug -> Johns
    { ...seedData.products[3], vendor_id: vendor2.id, category_id: electronics.id }, // Phone -> Janes
    { ...seedData.products[4], vendor_id: vendor1.id, category_id: clothing.id }     // Jeans -> Johns
  ];

  const { error: productsError } = await supabase
    .from('products')
    .upsert(productsWithRefs, { 
      onConflict: 'slug,vendor_id',
      ignoreDuplicates: false // update if exists
    });

  if (productsError) {
    console.error('Error creating products:', productsError);
    return;
  }
  console.log('✓ Created products');

  console.log('\n✨ Finished seeding data successfully!');
  console.log('\nTest users created (all with password: test1234):');
  seedData.users.forEach(u => console.log(`- ${u.email} (${u.role})`));
}

main().catch(console.error);