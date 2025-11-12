import fetch from 'node-fetch';
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

async function createAuthUser(userData) {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || data.message || 'Failed to create user');
    }

    if (!data.user) {
      throw new Error('No user data returned');
    }

    console.log('Auth user creation response:', data);
    return data.user;

  } catch (err) {
    console.error(`Error creating auth user ${userData.email}:`, err);
    throw err;
  }
}

async function createProfile(authUser, userData) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
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

    return data[0];
  } catch (err) {
    console.error(`Error creating profile for ${userData.email}:`, err);
    throw err;
  }
}

// Test user creation
const testUser = {
  email: 'seller1@example.com',
  password: 'test1234',
  full_name: 'John Doe',
  role: 'seller'
};

async function main() {
  try {
    console.log('Creating test auth user...');
    const authUser = await createAuthUser(testUser);
    console.log('Auth user created:', authUser);

    console.log('\nCreating test profile...');
    const profile = await createProfile(authUser, testUser);
    console.log('Profile created:', profile);

  } catch (err) {
    console.error('Test failed:', err);
  }
}

main();