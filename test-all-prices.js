import('dotenv').then(dotenv => dotenv.default.config());
import('./src/api/EcommerceApi.js').then(module => {
  (async () => {
    console.log('All products and price ranges:\n');
    const allProducts = await module.getProducts({ sortBy: 'price_desc' });
    console.log(`Total: ${allProducts.total}`);
    
    allProducts.products.forEach(p => {
      const price = p.base_price || 0;
      let range = 'unknown';
      if (price <= 5000) range = 'under-50';
      else if (price <= 20000) range = '50-200';
      else if (price <= 50000) range = '200-500';
      else range = 'over-500';
      console.log(`${p.title} — ${price} cents ($${(price/100).toFixed(2)}) [${range}]`);
    });
  })();
});
