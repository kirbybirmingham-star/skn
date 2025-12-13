import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function main() {
  console.log('Testing client-side price sorting (mimics ProductsList.jsx logic)');
  const { getProducts } = await import('../src/api/EcommerceApi.js');
  
  try {
    const resp = await getProducts({ page: 1, perPage: 200 });
    const products = resp.products || [];
    
    console.log(`\nFetched ${products.length} products`);
    
    // Check if __effective_price is attached
    const missing = products.filter(p => p.__effective_price == null).length;
    console.log(`Products with __effective_price: ${products.length - missing}/${products.length}`);
    
    // Now do client-side sorting like ProductsList.jsx does
    const priceAsc = [...products].sort((a, b) => {
      const diff = (a.__effective_price || 0) - (b.__effective_price || 0);
      return diff; // ascending
    });
    
    const priceDesc = [...products].sort((a, b) => {
      const diff = (a.__effective_price || 0) - (b.__effective_price || 0);
      return -diff; // descending
    });
    
    console.log('\n--- price_asc (low to high) ---');
    priceAsc.slice(0, 10).forEach(p => {
      console.log(`  ${p.title} — __eff:${p.__effective_price} base:${p.base_price}`);
    });
    
    console.log('\n--- price_desc (high to low) ---');
    priceDesc.slice(0, 10).forEach(p => {
      console.log(`  ${p.title} — __eff:${p.__effective_price} base:${p.base_price}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main().catch(console.error);
