import('dotenv').then(dotenv => dotenv.default.config());
import('./src/api/EcommerceApi.js').then(module => {
  (async () => {
    console.log('Testing price range filtering with existing products:\n');
    
    // Test under-50 (under 5000 cents)
    console.log('--- under-50 (should be < 5000 cents)');
    const under50 = await module.getProducts({ priceRange: 'under-50', sortBy: 'price_desc' });
    console.log(`Found ${under50.total} items:`);
    under50.products.slice(0, 10).forEach(p => {
      console.log(`  ${p.title} — ${p.base_price} cents`);
    });
    
    // Test 50-200 (5000-20000 cents)
    console.log('\n--- 50-200 (should be 5000-20000 cents)');
    const range50200 = await module.getProducts({ priceRange: '50-200', sortBy: 'price_desc' });
    console.log(`Found ${range50200.total} items:`);
    range50200.products.slice(0, 10).forEach(p => {
      console.log(`  ${p.title} — ${p.base_price} cents`);
    });
    
    // Test over-500 (should still show items > 50000 cents, which don't exist)
    console.log('\n--- over-500 (should be > 50000 cents - likely empty)');
    const over500 = await module.getProducts({ priceRange: 'over-500', sortBy: 'price_desc' });
    console.log(`Found ${over500.total} items:`);
    over500.products.forEach(p => {
      console.log(`  ${p.title} — ${p.base_price} cents`);
    });
    
  })();
});
