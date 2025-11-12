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

async function main() {
  console.log('Fetching auth users...');
  
  // First, get all users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`Found ${users?.length || 0} users`);

  // Delete each user
  if (users && users.length > 0) {
    for (const user of users) {
      try {
        console.log(`Deleting user ${user.email}...`);
        
        // Delete from profiles first (due to foreign key)
        await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);

        // Then delete the auth user
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`Error deleting user ${user.email}:`, deleteError);
        } else {
          console.log(`✓ Deleted user ${user.email}`);
        }
      } catch (err) {
        console.error(`Error processing user ${user.email}:`, err);
      }
    }
  }

  console.log('\n✨ Cleanup completed!');
}

main().catch(console.error);