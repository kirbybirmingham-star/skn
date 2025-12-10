import('dotenv').then(dotenv => dotenv.default.config());
import('./src/api/EcommerceApi.js').then(module => {
  (async () => {
    console.log('Testing all price ranges:\n');
    
    const ranges = ['under-50', '50-200', '200-500', 'over-500'];
    for (const range of ranges) {
      const result = await module.getProducts({ priceRange: range });
      console.log(`${range}: ${result.total} items`);
    }
  })();
});
