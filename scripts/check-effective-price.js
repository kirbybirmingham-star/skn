import { getProducts } from '../src/api/EcommerceApi.js';

(async () => {
  try {
    const { products } = await getProducts({ page: 1, perPage: 200, priceRange: 'all' });
    let missing = 0;
    for (const p of products) {
      if (p.__effective_price == null) {
        console.log(`MISSING __effective_price -> id:${p.id} title:${p.title}`);
        missing++;
      }
      if (typeof p.__effective_price === 'number') {
        // print a few sample transformed values to spot-check
        console.log(`id:${p.id} title:${p.title} __effective_price:${p.__effective_price}`);
      }
    }
    console.log(`Checked ${products.length} products. Missing: ${missing}`);
  } catch (e) {
    console.error('Error checking effective prices:', e);
    process.exit(1);
  }
})();