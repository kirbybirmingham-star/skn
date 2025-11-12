import fetch from 'node-fetch';
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

const supabaseRestUrl = `${supabaseUrl}/rest/v1`;
const supabaseAuthUrl = `${supabaseUrl}/auth/v1`;

const headers = {
  'Content-Type': 'application/json',
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`
};

async function createAuthUser(userData) {
  try {
    const response = await fetch(`${supabaseAuthUrl}/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role
        },
        email_confirm: true
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || data.message || 'Failed to create user');
    }

    if (!data.user) {
      throw new Error('No user data returned');
    }

    return data.user;
  } catch (err) {
    console.error(`Error creating auth user ${userData.email}:`, err.message);
    throw err;
  }
}

async function createProfile(authUser, userData) {
  try {
    const response = await fetch(`${supabaseRestUrl}/profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: authUser.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error('Failed to create profile');
    }

    return data[0]; // Supabase returns array for inserts
  } catch (err) {
    console.error(`Error creating profile for ${userData.email}:`, err.message);
    throw err;
  }
}

const seedData = {
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

async function createVendors(sellers) {
  try {
    const seller1 = sellers.find(s => s.email === 'seller1@example.com');
    const seller2 = sellers.find(s => s.email === 'seller2@example.com');

    if (!seller1 || !seller2) {
      throw new Error('Could not find required seller profiles');
    }

    const vendors = [
      { ...seedData.vendors[0], owner_id: seller1.id },
      { ...seedData.vendors[1], owner_id: seller2.id }
    ];

    const response = await fetch(`${supabaseRestUrl}/vendors`, {
      method: 'POST',
      headers,
      body: JSON.stringify(vendors)
    });

    if (!response.ok) {
      throw new Error('Failed to create vendors');
    }

    return await response.json();
  } catch (err) {
    console.error('Error creating vendors:', err);
    throw err;
  }
}

async function createCategories() {
  try {
    const response = await fetch(`${supabaseRestUrl}/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify(seedData.categories)
    });

    if (!response.ok) {
      throw new Error('Failed to create categories');
    }

    return await response.json();
  } catch (err) {
    console.error('Error creating categories:', err);
    throw err;
  }
}

async function createProducts(vendors, categories) {
  try {
    const vendor1 = vendors.find(v => v.slug === 'johns-general-store');
    const vendor2 = vendors.find(v => v.slug === 'janes-gadgets');
    const electronics = categories.find(c => c.slug === 'electronics');
    const clothing = categories.find(c => c.slug === 'clothing');
    const homeGoods = categories.find(c => c.slug === 'home-goods');

    if (!vendor1 || !vendor2 || !electronics || !clothing || !homeGoods) {
      throw new Error('Missing required vendors or categories');
    }

    const productsWithRefs = [
      { ...seedData.products[0], vendor_id: vendor2.id, category_id: electronics.id }, // Laptop -> Janes
      { ...seedData.products[1], vendor_id: vendor1.id, category_id: clothing.id },    // T-Shirt -> Johns
      { ...seedData.products[2], vendor_id: vendor1.id, category_id: homeGoods.id },   // Mug -> Johns
      { ...seedData.products[3], vendor_id: vendor2.id, category_id: electronics.id }, // Phone -> Janes
      { ...seedData.products[4], vendor_id: vendor1.id, category_id: clothing.id }     // Jeans -> Johns
    ];

    const response = await fetch(`${supabaseRestUrl}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(productsWithRefs)
    });

    if (!response.ok) {
      throw new Error('Failed to create products');
    }

    return await response.json();
  } catch (err) {
    console.error('Error creating products:', err);
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
      // Create auth user first
      const authUser = await createAuthUser(userData);
      console.log(`✓ Created auth user ${userData.email}`);

      // Create profile
      const profile = await createProfile(authUser, userData);
      console.log(`✓ Created profile for ${userData.email}`);
      profiles.push(profile);
    } catch (err) {
      console.error(`Failed to process user ${userData.email}:`, err.message);
    }
  }

  const sellers = profiles.filter(p => p.role === 'seller');
  if (sellers.length < 2) {
    console.error('Error: At least two seller profiles are needed to seed vendors.');
    return;
  }

  // Step 2: Create vendors
  console.log('\nCreating vendors...');
  const vendors = await createVendors(sellers);
  console.log('✓ Created vendors');

  // Step 3: Create categories
  console.log('\nCreating categories...');
  const categories = await createCategories();
  console.log('✓ Created categories');

  // Step 4: Create products
  console.log('\nCreating products...');
  await createProducts(vendors, categories);
  console.log('✓ Created products');

  console.log('\n✨ Finished seeding data successfully!');
  console.log('\nTest users created (all with password: test1234):');
  seedData.users.forEach(u => console.log(`- ${u.email} (${u.role})`));
}

main().catch(console.error);