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

async function createUser() {
  const user = {
    email: 'seller1@example.com',
    password: 'test1234',
    email_confirm: true,
    data: {
      full_name: 'John Doe',
      role: 'seller'
    }
  };

  try {
    // Try the signup endpoint first
    const signupResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        data: user.data
      })
    });

    const signupData = await signupResponse.json();
    console.log('Signup response:', signupData);

    if (!signupResponse.ok) {
      throw new Error(signupData.msg || signupData.message || 'Signup failed');
    }

    // Try to verify the email directly through admin API
    const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        type: 'signup',
        email: user.email
      })
    });

    const verifyData = await verifyResponse.json();
    console.log('Verify response:', verifyData);

  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}

createUser().catch(console.error);