import fetch from 'node-fetch';

const productId = '0d39966f-d67f-4e45-94d5-81f10d48bbc4';
const url = `http://localhost:3001/api/reviews/${productId}`;

console.log(`Testing reviews API endpoint: ${url}`);

try {
  const response = await fetch(url);
  const text = await response.text();
  console.log('Status:', response.status);
  console.log('Response:', text);
  
  if (response.ok) {
    const data = JSON.parse(text);
    console.log('Reviews found:', data.length || 0);
    console.log('Data:', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.error('Error:', error.message);
}
