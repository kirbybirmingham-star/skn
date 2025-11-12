import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

// Import the app's API
import { getProducts } from '../src/api/EcommerceApi.js';

async function main() {
  console.log('Calling getProducts from app API...');
  try {
    const resp = await getProducts({ page:1, perPage:5 });
    console.log('Total:', resp.total);
    console.log('Products sample:');
    console.log(JSON.stringify(resp.products, null, 2));
  } catch (err) {
    console.error('getProducts failed:', err);
  }
}

main().catch(console.error);
