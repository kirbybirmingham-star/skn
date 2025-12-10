import('dotenv').then(dotenv => dotenv.default.config());
import('./src/api/EcommerceApi.js').then(module => {
  // Patch console.warn to see debug logs
  const originalWarn = console.warn;
  console.warn = function(...args) {
    console.error('[WARN]', ...args);
    originalWarn(...args);
  };
  
  (async () => {
    console.log('Testing with debug logging:\n');
    const result = await module.getProducts({ priceRange: 'under-50', sortBy: 'price_desc' });
    console.log(`\nFound ${result.total} items (should be << 33)`);
    result.products.slice(0, 5).forEach(p => {
      console.log(`  ${p.title} — ${p.base_price} cents`);
    });
  })();
});
