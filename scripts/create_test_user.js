import fetch from 'node-fetch';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Supabase credentials missing in .env');
  process.exit(1);
}

async function createTestUser(email, password) {
  const url = `${SUPABASE_URL}/auth/v1/signup`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  console.log('Supabase signup response:', data);
}

// Default test user
const emailArg = process.argv[2];
const passwordArg = process.argv[3];

const candidates = []
if (emailArg) candidates.push(emailArg)
else {
  candidates.push('test.user@example.com')
  candidates.push('testuser@example.com')
  candidates.push('tester123@example.com')
}

// Default password for seeded test user. Set to a simple test password for local/dev use.
const password = passwordArg || 'test1234';

;(async () => {
  for (const email of candidates) {
    console.log('Attempting to create user with email:', email)
    try {
      await createTestUser(email, password)
      console.log('User creation attempted for', email)
      break
    } catch (err) {
      console.error('Attempt failed for', email, err.message || err)
    }
  }

  console.log('\nIf all attempts failed:')
  console.log('- Check Supabase project settings: email confirmations, allowed domains, or disabled signups.')
  console.log('- For admin creation you need the Service Role key from Supabase (do NOT commit it to source control).')
})()
