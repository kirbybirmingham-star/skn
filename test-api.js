const productId = '0d39966f-d67f-4e45-94d5-81f10d48bbc4';
const api = `http://localhost:3001/api/reviews/${productId}`;

console.log(`Testing API: ${api}\n`);

fetch(api)
  .then(r => r.json())
  .then(data => {
    console.log('Reviews API response:');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(e => console.error('Error:', e.message));
