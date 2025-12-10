import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function main() {
  console.log('Testing getProducts sorts');
  const { getProducts } = await import('../src/api/EcommerceApi.js');
  const opts = [
    { sortBy: 'newest' },
    { sortBy: 'oldest' },
    { sortBy: 'price_asc' },
    { sortBy: 'price_desc' },
    { sortBy: 'rating_desc' },
  ];

  for (const o of opts) {
    try {
      const resp = await getProducts({ page: 1, perPage: 6, ...o });
      console.log('---', o.sortBy, 'total', resp.total);
      (resp.products || []).slice(0,5).forEach(p => console.log(`${p.title} — ${p.base_price} — id:${p.id}`));
    } catch (err) {
      console.error('Failed for', o, err);
    }
  }
}

main().catch(console.error);
