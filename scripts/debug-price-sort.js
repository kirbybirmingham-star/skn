import { getProducts } from '../src/api/EcommerceApi.js';

(async () => {
  try {
    const res = await getProducts({ sortBy: 'price_desc', perPage: 10 });
    console.log('Testing price_desc sorting:');
    console.log(`Total returned: ${res.products.length}`);
    res.products.slice(0, 10).forEach(p => {
      console.log(`title: ${p.title}, base_price: ${p.base_price}, __effective_price: ${p.__effective_price}`);
    });
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
