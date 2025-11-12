import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function queryVendorProducts() {
  console.log('Querying vendor_products view...');
  try {
    const { data, error } = await supabase
      .from('vendor_products')
      .select('*')
      .limit(10); // Limit to 10 for a sample

    if (error) {
      console.error('Error querying vendor_products:', error);
      return;
    }

    console.log('Vendor Products (sample of 10):');
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Failed to query vendor_products:', err);
  }
}

queryVendorProducts().catch(console.error);
