import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

function getDisplayPrice(p) {
  if (p && (typeof p.base_price === 'number') && p.base_price > 0) return Number(p.base_price);
  if (Array.isArray(p.product_variants) && p.product_variants.length > 0) {
    const candidatePrices = [];
    for (const v of p.product_variants) {
      if (!v) continue;
      if (typeof v.price_in_cents === 'number' && v.price_in_cents > 0) candidatePrices.push(Number(v.price_in_cents));
      else if (typeof v.price === 'number' && v.price > 0) candidatePrices.push(Math.round(Number(v.price) * 100));
      else if (typeof v.base_price === 'number' && v.base_price > 0) candidatePrices.push(Number(v.base_price));
    }
    if (candidatePrices.length > 0) return Math.min(...candidatePrices);
  }
  return null;
}

(async function main(){
  const { getProducts } = await import('../src/api/EcommerceApi.js');
  const { products } = await getProducts({ page:1, perPage:50 });
  const withPrice = products.map(p => ({ ...p, __displayPrice: getDisplayPrice(p) }));
  console.log('\n--- before ---');
  withPrice.slice(0,10).forEach(p => console.log(p.title, p.__displayPrice));
  console.log('\n--- price_desc ---');
  withPrice.sort((a,b) => (b.__displayPrice || 0) - (a.__displayPrice || 0)).slice(0,10).forEach(p => console.log(p.title, p.__displayPrice));
  console.log('\n--- price_asc ---');
  withPrice.sort((a,b) => (a.__displayPrice || 0) - (b.__displayPrice || 0)).slice(0,10).forEach(p => console.log(p.title, p.__displayPrice));
})().catch(err => console.error(err));
