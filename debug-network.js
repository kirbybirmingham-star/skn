import http from 'http';
import WebSocket from 'ws';

const DEBUG_PORT = 9222;

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function getTarget() {
  const targets = await fetchJSON(`http://localhost:${DEBUG_PORT}/json/list`);
  return targets.find(t => t.type === 'page' && !t.url.includes('devtools://') && t.url.includes('localhost'));
}

function connectWebSocket(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

async function captureNetworkRequest(ws) {
  console.log('🔍 Monitoring network requests for /api/onboarding/me...\n');
  
  let messageId = 1;
  const captured = {
    requests: [],
    responses: [],
    responseData: []
  };
  
  // Enable network domain
  ws.send(JSON.stringify({
    id: messageId++,
    method: 'Network.enable'
  }));
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log('\n⏱️  Timeout reached, stopping capture...\n');
      resolve(captured);
    }, 5000);
    
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        
        // Capture outgoing requests
        if (msg.method === 'Network.requestWillBeSent') {
          const req = msg.params.request;
          if (req.url.includes('/api/onboarding/me')) {
            console.log('📤 REQUEST:', req.method, req.url);
            console.log('   Headers:', JSON.stringify(req.headers, null, 2));
            captured.requests.push(req);
          }
        }
        
        // Capture response headers
        if (msg.method === 'Network.responseReceived') {
          const res = msg.params.response;
          if (res.url.includes('/api/onboarding/me')) {
            console.log('\n📥 RESPONSE HEADERS:');
            console.log('   Status:', res.status, res.statusText);
            console.log('   Content-Type:', res.headers['content-type']);
            console.log('   Headers:', JSON.stringify(res.headers, null, 2));
            captured.responses.push(res);
          }
        }
        
        // Capture response body
        if (msg.method === 'Network.loadingFinished') {
          const reqId = msg.params.requestId;
          // Request the response body
          ws.send(JSON.stringify({
            id: messageId++,
            method: 'Network.getResponseBody',
            params: { requestId: reqId }
          }));
        }
        
        // Handle response body callback
        if (msg.result && msg.result.body !== undefined) {
          console.log('\n📄 RESPONSE BODY:');
          console.log(msg.result.body.substring(0, 1000));
          if (msg.result.body.length > 1000) {
            console.log(`... (${msg.result.body.length - 1000} more characters)`);
          }
          captured.responseData.push(msg.result.body);
          
          // Verify JSON
          try {
            JSON.parse(msg.result.body);
            console.log('\n✅ Response is valid JSON');
          } catch (e) {
            console.log('\n❌ Response is NOT valid JSON');
            console.log('   Error:', e.message);
            
            // Check if it's HTML
            if (msg.result.body.trim().startsWith('<')) {
              console.log('   Looks like HTML - backend may be serving static files instead');
            }
          }
          
          // Stop after first response
          clearTimeout(timeout);
          resolve(captured);
        }
        
      } catch (e) {
        // Silent
      }
    });
  });
}

async function main() {
  console.log('🔍 Debugging /api/onboarding/me response\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const target = await getTarget();
  if (!target) {
    console.error('❌ No target page found');
    process.exit(1);
  }
  
  console.log('📄 Target:', target.title);
  console.log('🔗 URL:', target.url);
  console.log('');
  
  const ws = await connectWebSocket(target.webSocketDebuggerUrl);
  console.log('✓ Connected to debugger\n');
  
  const captured = await captureNetworkRequest(ws);
  
  ws.close();
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Requests captured: ${captured.requests.length}`);
  console.log(`Responses captured: ${captured.responses.length}`);
  console.log(`Response bodies captured: ${captured.responseData.length}`);
  
  if (captured.requests.length === 0) {
    console.log('\n⚠️  No /api/onboarding/me requests were captured.');
    console.log('   This could mean:');
    console.log('   1. Supabase is not configured (endpoint returns early)');
    console.log('   2. No auth token is being sent');
    console.log('   3. The request is being blocked');
  }
}

main().catch(console.error);
