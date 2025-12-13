import { formatCurrency } from '../src/api/EcommerceApi.js';

console.log('formatCurrency(1299900):', formatCurrency(1299900, { code: 'USD' }));
console.log('formatCurrency(1299900) with symbol override:', formatCurrency(1299900, { code: 'USD', symbol: '$' }));
console.log('formatCurrency(1299900) with EUR:', formatCurrency(1299900, { code: 'EUR' }));
