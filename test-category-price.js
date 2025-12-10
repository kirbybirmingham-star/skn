import('dotenv').then(dotenv => dotenv.default.config());
import('./src/api/EcommerceApi.js').then(module => {
  (async () => {
    console.log('Testing price filtering WITH and WITHOUT categoryId:\n');
    
    // Test 1: under-50 with categoryId
    console.log('--- under-50 WITH categoryId: 4');
    const result1 = await module.getProducts({ categoryId: 4, priceRange: 'under-50', sortBy: 'price_desc' });
    console.log(`Found ${result1.total} items (expected 2: Fresh Starfruit $3.50, Fresh Plantains $4.50)`);
    result1.products.forEach(p => {
      console.log(`  ${p.title} — ${p.base_price} cents`);
    });
    
    // Test 2: under-50 WITHOUT categoryId (all products)
    console.log('\n--- under-50 WITHOUT categoryId');
    const result2 = await module.getProducts({ priceRange: 'under-50', sortBy: 'price_desc' });
    console.log(`Found ${result2.total} items`);
    result2.products.slice(0, 10).forEach(p => {
      console.log(`  ${p.title} — ${p.base_price} cents`);
    });
    
    // Test 3: List all products by category
    console.log('\n--- All categories found');
    const cats = await module.getCategories();
    console.log('Categories:', cats.map(c => `${c.name} (id: ${c.id})`).join(', '));
    
  })();
});
