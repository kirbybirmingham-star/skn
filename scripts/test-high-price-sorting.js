import { getProducts } from '../src/api/EcommerceApi.js';

(async () => {
  try {
    const ranges = ['over-500', 'over-1000', 'all'];
    for (const r of ranges) {
      const res = await getProducts({ priceRange: r, sortBy: 'price_desc', perPage: 100 });
      const products = res.products || [];
      console.log(`Range ${r}: returned ${products.length} products.`);
      products.slice(0, 10).forEach(p => console.log(`  id:${p.id} title:${p.title} base_price:${p.base_price} __effective_price:${p.__effective_price} category_id:${p.category_id}`));
    }
  } catch (e) {
    console.error('Error testing high price sorting:', e);
    process.exit(1);
  }
})();