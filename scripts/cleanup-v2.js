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

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    console.log('Starting cleanup...');

    // First, delete all data from tables
    console.log('\nDeleting data from tables...');
    await supabase.from('products').delete();
    await supabase.from('vendors').delete();
    await supabase.from('categories').delete();
    await supabase.from('profiles').delete();
    console.log('✓ Database tables cleared');

    // Then delete the auth users one by one
    console.log('\nDeleting auth users...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    console.log(`Found ${users?.length || 0} users to delete`);

    if (users && users.length > 0) {
      for (const user of users) {
        try {
          console.log(`Deleting user ${user.email}...`);
          
          // Delete the user's profile first
          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);

          if (profileError) {
            console.error(`Error deleting profile for ${user.email}:`, profileError);
          }

          // Wait a bit between operations
          await delay(500);

          // Then delete the auth user
          const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
          
          if (deleteError) {
            console.error(`Error deleting user ${user.email}:`, deleteError);
          } else {
            console.log(`✓ Deleted user ${user.email}`);
          }

          // Wait between users
          await delay(500);

        } catch (err) {
          console.error(`Error processing user ${user.email}:`, err);
        }
      }
    }

    console.log('\n✨ Cleanup completed!');
    
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
}

main();