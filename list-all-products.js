import('dotenv').then(dotenv => dotenv.default.config());
import('./src/api/EcommerceApi.js').then(module => {
  (async () => {
    const result = await module.getProducts({ sortBy: 'newest', priceRange: 'all' });
    console.log('All products in DB:');
    result.products.forEach(p => {
      console.log(`${p.title} — ${p.base_price || 'null'} cents`);
    });
  })();
});
