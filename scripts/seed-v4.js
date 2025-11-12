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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Fresh seed data without any pre-existing IDs
const seedData = {
  users: [
    { 
      email: 'seller1@example.com', 
      password: 'test1234', 
      full_name: 'John Doe', 
      role: 'seller',
      website: 'https://johndoe.com',
      avatar_url: null
    },
    { 
      email: 'seller2@example.com', 
      password: 'test1234', 
      full_name: 'Jane Smith', 
      role: 'seller',
      website: 'https://janesmith.com',
      avatar_url: null
    },
    { 
      email: 'buyer1@example.com', 
      password: 'test1234', 
      full_name: 'Peter Jones', 
      role: 'buyer',
      website: null,
      avatar_url: null
    }
  ],
  vendors: [
    { 
      name: 'Johns General Store', 
      slug: 'johns-general-store', 
      description: 'A little bit of everything',
      status: 'active',
      onboarding_completed: true,
      stripe_account_id: null,
      paypal_merchant_id: null
    },
    { 
      name: 'Janes Gadgets', 
      slug: 'janes-gadgets', 
      description: 'The latest and greatest gadgets',
      status: 'active',
      onboarding_completed: true,
      stripe_account_id: null,
      paypal_merchant_id: null
    }
  ],
  categories: [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Clothing', slug: 'clothing' },
    { name: 'Home & Garden', slug: 'home-garden' }
  ],
  products: [
    { 
      title: 'Laptop', 
      slug: 'laptop', 
      description: 'A powerful laptop for all your needs', 
      base_price: 120000,  // $1,200.00 
      currency: 'USD', 
      is_published: true,
      status: 'active',
      stock_status: 'in_stock',
      shipping_weight: 2500, // 2.5kg
      image_url: 'https://szdguntfxyateielmdtx.supabase.co/storage/v1/object/public/product-images/laptop.jpg',
      gallery_images: []
    },
    { 
      title: 'T-Shirt', 
      slug: 't-shirt', 
      description: 'A comfortable cotton t-shirt', 
      base_price: 2500,    // $25.00
      currency: 'USD', 
      is_published: true,
      status: 'active',
      stock_status: 'in_stock',
      shipping_weight: 200,  // 200g
      image_url: 'https://szdguntfxyateielmdtx.supabase.co/storage/v1/object/public/product-images/t-shirt.jpg',
      gallery_images: []
    },
    { 
      title: 'Garden Tools Set', 
      slug: 'garden-tools-set', 
      description: 'Complete set of essential garden tools', 
      base_price: 4500,    // $45.00
      currency: 'USD', 
      is_published: true,
      status: 'active',
      stock_status: 'in_stock',
      shipping_weight: 1500, // 1.5kg
      image_url: 'https://szdguntfxyateielmdtx.supabase.co/storage/v1/object/public/product-images/garden-tools.jpg',
      gallery_images: []
    }
  ]
};

async function createAuthUser(userData) {
  try {
    // Create user with auto-confirmed email
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role
      }
    });

    if (error) throw error;
    if (!user) throw new Error('No user data returned');

    // Wait briefly to ensure user is created in auth schema
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return user;
  } catch (err) {
    console.error(`Error creating auth user ${userData.email}:`, err.message);
    throw err;
  }
}

async function main() {
  console.log('Starting fresh database seed...');

  try {
    // Step 1: Create users and profiles
    console.log('\nCreating users and profiles...');
    const profiles = [];
    
    for (const userData of seedData.users) {
      // Create auth user
      const user = await createAuthUser(userData);
      console.log(`✓ Created auth user ${userData.email}`);

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          website: userData.website,
          avatar_url: userData.avatar_url
        })
        .select()
        .single();

      if (profileError) {
        console.error(`Error creating profile for ${userData.email}:`, profileError);
        continue;
      }

      console.log(`✓ Created profile for ${userData.email}`);
      profiles.push(profile);
    }

    // Step 2: Create vendors
    console.log('\nCreating vendors...');
    const sellers = profiles.filter(p => p.role === 'seller');
    const sellerMap = {
      'seller1@example.com': sellers[0],
      'seller2@example.com': sellers[1]
    };

    const vendors = [];
    for (let i = 0; i < seedData.vendors.length; i++) {
      const vendorData = seedData.vendors[i];
      const owner = sellerMap[seedData.users[i].email];
      
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .insert({
          ...vendorData,
          owner_id: owner.id
        })
        .select()
        .single();

      if (vendorError) {
        console.error(`Error creating vendor ${vendorData.name}:`, vendorError);
        continue;
      }

      console.log(`✓ Created vendor ${vendorData.name}`);
      vendors.push(vendor);
    }

    // Step 3: Create categories
    console.log('\nCreating categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .insert(seedData.categories)
      .select();

    if (categoriesError) {
      throw categoriesError;
    }
    console.log(`✓ Created ${categories.length} categories`);

    // Step 4: Create products
    console.log('\nCreating products...');
    const productsWithRefs = seedData.products.map((product, index) => {
      const vendor = vendors[index % vendors.length]; // Alternate between vendors
      const category = categories[index % categories.length]; // Distribute across categories
      return {
        ...product,
        vendor_id: vendor.id,
        category_id: category.id
      };
    });

    const { data: products, error: productsError } = await supabase
      .from('products')
      .insert(productsWithRefs)
      .select();

    if (productsError) {
      throw productsError;
    }
    console.log(`✓ Created ${products.length} products`);

    console.log('\n✨ Database seeded successfully!');
    console.log('\nTest users created (all with password: test1234):');
    seedData.users.forEach(u => console.log(`- ${u.email} (${u.role})`));

  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

main();