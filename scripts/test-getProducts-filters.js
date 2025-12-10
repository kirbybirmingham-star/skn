import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function main() {
  console.log('Testing getProducts filters');
  const { getProducts } = await import('../src/api/EcommerceApi.js');
  const tests = [
    { categoryId: 4, priceRange: 'under-50', sortBy: 'price_asc' },
    { categoryId: 4, priceRange: 'price-50-200', sortBy: 'price_desc' },
    { searchQuery: 'coffee', priceRange: 'all', sortBy: 'newest' },
  ];

  for (const t of tests) {
    try {
      console.log('---', t);
      const resp = await getProducts({ page:1, perPage: 5, ...t });
      console.log('Total:', resp.total);
      console.log(JSON.stringify(resp.products.map(p => ({ title: p.title, base_price: p.base_price, id: p.id })), null, 2));
    } catch (err) {
      console.error('Test failed', t, err);
    }
  }
}

main().catch(console.error);
