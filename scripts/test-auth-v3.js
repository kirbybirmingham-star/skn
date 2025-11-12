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

// Just try one test user first
const testUser = {
  email: 'seller1@example.com',
  password: 'test1234',
  full_name: 'John Doe',
  role: 'seller'
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    console.log('Testing user creation...');

    // First check if we can sign up directly
    console.log('\nAttempting signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          full_name: testUser.full_name,
          role: testUser.role
        }
      }
    });

    if (signupError) {
      console.error('Signup error:', signupError);
      return;
    }

    console.log('Signup response:', signupData);

    // Wait a bit
    await delay(2000);

    // Check if we can create a profile
    if (signupData.user) {
      console.log('\nCreating profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signupData.user.id,
          email: testUser.email,
          full_name: testUser.full_name,
          role: testUser.role
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return;
      }

      console.log('Profile created:', profile);
    }

    console.log('\n✨ Test completed!');

  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

main();