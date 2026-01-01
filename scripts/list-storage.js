import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function main() {
  const bucketName = process.argv[2] || 'listings-images';
  console.log(`Checking ${bucketName} bucket...\n`);

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 100 });

    if (error) {
      console.error('Error listing bucket:', error);
      return;
    }

    console.log(`Found ${data.length} items in ${bucketName} bucket:\n`);
    data.forEach(item => {
      console.log(`  ${item.name}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main().catch(console.error);
