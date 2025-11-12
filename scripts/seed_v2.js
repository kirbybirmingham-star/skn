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

// Seed data remains the same as seed_updated.js
const seedData = {
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
  ]
};

// Updated to handle existing users
async function getOrCreateAuthUser(userData) {
  try {
    // First try to get existing user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === userData.email);
    
    if (user) {
      console.log(`Using existing user: ${userData.email}`);
      return user;
    }

    // If user doesn't exist, create them
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
    
    console.log(`Created new user: ${userData.email}`);
    return data.user;
  } catch (err) {
    console.error(`Error processing user ${userData.email}:`, err.message);
    throw err;
  }
}

async function getOrCreateProfile(authUser, userData) {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select()
    .eq('id', authUser.id)
    .single();

  if (existingProfile) {
    console.log(`Profile exists for ${userData.email}`);
    return existingProfile;
  }

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
    throw profileError;
  }

  console.log(`Created profile for ${userData.email}`);
  return profile;
}

async function getOrCreateVendor(user, vendorData) {
  const { data: existingVendor } = await supabase
    .from('vendors')
    .select()
    .eq('owner_id', user.id)
    .single();

  if (existingVendor) {
    console.log(`Vendor exists: ${vendorData.business_name}`);
    return existingVendor;
  }

  const { data: vendor, error } = await supabase
    .from('vendors')
    .insert({
      ...vendorData,
      owner_id: user.id,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error(`Error creating vendor for ${user.email}:`, error);
    throw error;
  }

  console.log(`Created vendor: ${vendorData.business_name}`);
  return vendor;
}

async function main() {
  console.log('Starting to seed data...');

  // Process users and create profiles
  const profiles = [];
  for (const userData of seedData.users) {
    try {
      const authUser = await getOrCreateAuthUser(userData);
      const profile = await getOrCreateProfile(authUser, userData);
      profiles.push({ ...profile, role: userData.role });
    } catch (err) {
      console.error(`Failed to process user ${userData.email}:`, err.message);
    }
  }

  // Create vendors for sellers
  const sellers = profiles.filter(p => p.role === 'seller');
  const vendors = [];
  
  for (let i = 0; i < Math.min(sellers.length, seedData.vendors.length); i++) {
    try {
      const vendor = await getOrCreateVendor(sellers[i], seedData.vendors[i]);
      vendors.push(vendor);
    } catch (err) {
      console.error(`Failed to process vendor for ${sellers[i].email}:`, err.message);
    }
  }

  console.log('\n✨ Finished seeding data successfully!');
  console.log('\nTest users created (all with password: test1234):');
  seedData.users.forEach(u => console.log(`- ${u.email} (${u.role})`));
}

main().catch(console.error);