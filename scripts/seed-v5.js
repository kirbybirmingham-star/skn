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

// Create Supabase client with retries
const supabase = createClient(supabaseUrl, supabaseKey);

// Fresh seed data with minimal test data
const seedData = {
  users: [
    { 
      email: 'seller1@example.com', 
      password: 'test1234', 
      full_name: 'John Doe', 
      role: 'seller'
    }
  ],
  vendors: [
    { 
      name: 'Johns General Store', 
      slug: 'johns-general-store', 
      description: 'A little bit of everything',
      status: 'active',
      onboarding_completed: true
    }
  ],
  categories: [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Clothing', slug: 'clothing' }
  ],
  products: [
    { 
      title: 'Laptop', 
      slug: 'laptop', 
      description: 'A powerful laptop', 
      base_price: 120000, 
      currency: 'USD', 
      is_published: true,
      status: 'active',
      stock_status: 'in_stock'
    }
  ]
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryOperation(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      console.log(`Attempt ${i + 1} failed, retrying...`);
      await delay(1000 * (i + 1));
    }
  }
}

async function createAuthUser(userData) {
  return retryOperation(async () => {
    try {
      // First check if user exists
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingUser = users?.find(u => u.email === userData.email);
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, using existing user`);
        return existingUser;
      }

      // Create new user
      const { data: { user }, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name
        }
      });

      if (error) throw error;
      if (!user) throw new Error('No user data returned');

      await delay(1000); // Wait for auth user to be fully created
      return user;
    } catch (err) {
      console.error(`Error in createAuthUser for ${userData.email}:`, err);
      throw err;
    }
  });
}

async function clearDatabase() {
  console.log('Clearing existing data...');
  
  // Delete in correct order to respect foreign keys
  await supabase.from('products').delete();
  await supabase.from('vendors').delete();
  await supabase.from('categories').delete();
  await supabase.from('profiles').delete();
  
  console.log('Database cleared');
}

async function main() {
  try {
    console.log('Starting database seed...');
    
    // Clear existing data
    await clearDatabase();

    // Create auth user and profile
    const userData = seedData.users[0];
    console.log(`\nCreating auth user ${userData.email}...`);
    
    const authUser = await createAuthUser(userData);
    console.log(`✓ Created auth user ${userData.email}`);

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role
      })
      .select()
      .single();

    if (profileError) throw profileError;
    console.log(`✓ Created profile for ${userData.email}`);

    // Create vendor
    const vendorData = { ...seedData.vendors[0], owner_id: authUser.id };
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert(vendorData)
      .select()
      .single();

    if (vendorError) throw vendorError;
    console.log(`✓ Created vendor ${vendorData.name}`);

    // Create categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .insert(seedData.categories)
      .select();

    if (categoriesError) throw categoriesError;
    console.log(`✓ Created ${categories.length} categories`);

    // Create product
    const productData = {
      ...seedData.products[0],
      vendor_id: vendor.id,
      category_id: categories[0].id
    };

    const { error: productError } = await supabase
      .from('products')
      .insert(productData);

    if (productError) throw productError;
    console.log('✓ Created product');

    console.log('\n✨ Database seeded successfully!');
    console.log('\nTest user created:');
    console.log(`- Email: ${userData.email}`);
    console.log('- Password: test1234');
    console.log(`- Role: ${userData.role}`);

  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

main();