import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function main() {
  console.log('Testing getCategories');
  const { getCategories } = await import('../src/api/EcommerceApi.js');
  try {
    const cats = await getCategories();
    console.log('Categories:', JSON.stringify(cats, null, 2));
    const { supabase } = await import('../src/lib/customSupabaseClient.js');
    const { data: products, error } = await supabase.from('products').select('id, title, category_id, metadata, base_price').limit(5);
    console.log('Sample products:', JSON.stringify(products, null, 2), 'error:', error);
  } catch (err) {
    console.error('getCategories failed:', err);
  }
}

main().catch(console.error);
