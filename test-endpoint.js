// This script runs in Chrome console to inspect the actual response
// Open Chrome DevTools console and paste this to see what /api/onboarding/me is actually returning

(async () => {
  console.log('🔍 Testing /api/onboarding/me endpoint...\n');
  
  try {
    const response = await fetch('/api/onboarding/me', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('📊 Response Details:');
    console.log('Status:', response.status, response.statusText);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('URL:', response.url);
    console.log('');
    
    const contentType = response.headers.get('content-type') || '';
    console.log('Content-Type check:', contentType);
    console.log('Includes application/json?', contentType.includes('application/json'));
    console.log('');
    
    if (!contentType.includes('application/json')) {
      console.warn('⚠️  NOT JSON - Reading as text...');
      const text = await response.text();
      console.log('Response text (first 500 chars):\n', text.substring(0, 500));
      
      if (text.trim().startsWith('<')) {
        console.error('❌ ERROR: Response is HTML! Backend is serving index.html');
        console.log('\nThis usually means:');
        console.log('1. Vite proxy is not working');
        console.log('2. Backend is not running on port 3001');
        console.log('3. Route is not configured');
      }
    } else {
      console.log('✅ Valid JSON Content-Type');
      const json = await response.json();
      console.log('Parsed JSON:', json);
    }
    
  } catch (error) {
    console.error('❌ Fetch error:', error);
  }
})();
