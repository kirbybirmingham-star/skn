import('dotenv').then(dotenv => dotenv.default.config());
import('./src/api/EcommerceApi.js').then(module => {
  const EcommerceApi = module;
  
  (async () => {
    try {
      console.log('Testing high-priced items sorting...\n');
      
      // Test 1: Get all products sorted by price descending
      console.log('--- price_desc (should show high-priced items first)');
      const result = await EcommerceApi.getProducts({ sortBy: 'price_desc', priceRange: 'all' });
      console.log('Total:', result.total);
      console.log('First 10 products:');
      result.products.slice(0, 10).forEach(p => {
        console.log(`  ${p.title} — ${p.base_price} cents`);
      });
      
      // Test 2: Filter for over-500 price range
      console.log('\n--- over-500 price filter');
      const over500 = await EcommerceApi.getProducts({ priceRange: 'over-500', sortBy: 'price_desc' });
      console.log('Total:', over500.total);
      console.log('Products:');
      over500.products.slice(0, 10).forEach(p => {
        console.log(`  ${p.title} — ${p.base_price} cents`);
      });
      
      // Test 3: Check if specific high-priced items exist
      console.log('\n--- Checking for specific high-priced items');
      const allProducts = await EcommerceApi.getProducts({ sortBy: 'newest' });
      const highPriced = allProducts.products.filter(p => p.base_price > 500000);
      console.log(`Found ${highPriced.length} products with base_price > 500000 cents:`);
      highPriced.slice(0, 5).forEach(p => {
        console.log(`  ${p.title} — ${p.base_price} cents`);
      });
      
    } catch(e) {
      console.error('Error:', e.message);
      console.error(e.stack);
    }
  })();
});
