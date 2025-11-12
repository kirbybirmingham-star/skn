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

async function main() {
  console.log('\nCleaning up database...\n');

  // Delete existing data in reverse dependency order
  // Delete all data in reverse dependency order
  console.log('Removing products...');
  const { error: productsError } = await supabase
    .from('products')
    .delete()
    .not('id', 'is', null);
  if (productsError) console.log('Error deleting products:', productsError.message);
  
  console.log('Removing vendors...');
  const { error: vendorsError } = await supabase
    .from('vendors')
    .delete()
    .not('id', 'is', null);
  if (vendorsError) console.log('Error deleting vendors:', vendorsError.message);
  
  console.log('Removing categories...');
  const { error: categoriesError } = await supabase
    .from('categories')
    .delete()
    .not('id', 'is', null);
  if (categoriesError) console.log('Error deleting categories:', categoriesError.message);
  
  console.log('Removing profiles...');
  const { error: profilesError } = await supabase
    .from('profiles')
    .delete()
    .not('id', 'is', null);
  if (profilesError) console.log('Error deleting profiles:', profilesError.message);

  // Try to remove auth users if we have permission
  try {
    const { data: users } = await supabase.auth.admin.listUsers();
    if (users?.users) {
      console.log('Removing auth users...');
      for (const user of users.users) {
        await supabase.auth.admin.deleteUser(user.id);
      }
    }
  } catch (err) {
    console.log('Note: Could not remove auth users:', err.message);
  }

  console.log('\n✨ Database cleaned successfully!');
}

main().catch(console.error);