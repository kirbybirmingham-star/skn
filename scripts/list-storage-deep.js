import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function main() {
  console.log('Checking products folder in listings-images bucket...\n');

  try {
    const { data, error } = await supabase.storage
      .from('listings-images')
      .list('products', { limit: 100 });

    if (error) {
      console.error('Error listing:', error);
      return;
    }

    console.log(`Found ${data.length} product folders/files:\n`);
    data.forEach(item => {
      console.log(`  ${item.name}${item.id === null ? ' (folder)' : ''}`);
    });

    // Try to list contents of a specific product folder
    if (data.length > 0) {
      const firstItem = data[0];
      if (firstItem.id === null) { // It's a folder
        console.log(`\nListing contents of products/${firstItem.name}:\n`);
        const { data: subdata, error: suberror } = await supabase.storage
          .from('listings-images')
          .list(`products/${firstItem.name}`, { limit: 100 });

        if (suberror) {
          console.error('Error:', suberror);
        } else {
          subdata.forEach(item => {
            console.log(`    ${item.name}`);
          });
        }
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main().catch(console.error);
