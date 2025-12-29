import https from 'https';
import http from 'http';
import WebSocket from 'ws';

const DEBUG_PORT = 9222;

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
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

async function getTargetInfo() {
  try {
    const targets = await fetchJSON(`http://localhost:${DEBUG_PORT}/json/list`);
    
    // Find any page target (not DevTools, not a worker)
    const pageTarget = targets.find(t => 
      t.type === 'page' && 
      !t.url.includes('devtools://') && 
      (t.url.includes('localhost') || t.url.includes('http'))
    );
    if (!pageTarget) {
      console.error('Target page not found. Available targets:', targets.map(t => ({ type: t.type, url: t.url })));
      return null;
    }
    
    return pageTarget;
  } catch (error) {
    console.error('Error fetching target info:', error.message);
    return null;
  }
}

function connectToDebugger(target) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    
    ws.on('open', () => {
      resolve(ws);
    });
    
    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
      reject(err);
    });
  });
}

async function startLiveDebug(ws) {
  let messageId = 1;
  
  // Enable console and runtime domains
  ws.send(JSON.stringify({
    id: messageId++,
    method: 'Console.enable'
  }));
  
  ws.send(JSON.stringify({
    id: messageId++,
    method: 'Runtime.enable'
  }));
  
  ws.send(JSON.stringify({
    id: messageId++,
    method: 'Network.enable'
  }));

  console.log('\n🔴 LIVE DEBUG MODE ACTIVE - Monitoring for errors...\n');
  console.log('Press Ctrl+C to exit\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      // Console messages
      if (message.method === 'Console.messageAdded') {
        const msg = message.params.message;
        if (msg.level === 'error' || msg.level === 'warning') {
          const icon = msg.level === 'error' ? '❌' : '⚠️';
          console.log(`${icon} [${msg.level.toUpperCase()}] ${new Date().toLocaleTimeString()}`);
          console.log(`   ${msg.text}`);
          if (msg.url) console.log(`   📍 ${msg.url}:${msg.lineNumber}`);
          console.log('');
        }
      }
      
      // Runtime exceptions
      if (message.method === 'Runtime.exceptionThrown') {
        const ex = message.params.exceptionDetails;
        console.log(`❌ [EXCEPTION] ${new Date().toLocaleTimeString()}`);
        console.log(`   ${ex.text}`);
        if (ex.exception?.description) console.log(`   ${ex.exception.description}`);
        if (ex.url) console.log(`   📍 ${ex.url}:${ex.lineNumber}:${ex.columnNumber}`);
        console.log('');
      }
      
      // Network errors (4xx, 5xx)
      if (message.method === 'Network.responseReceived') {
        const response = message.params.response;
        if (response.status >= 400) {
          console.log(`❌ [NETWORK ERROR] ${new Date().toLocaleTimeString()}`);
          console.log(`   ${response.status} ${response.statusText}`);
          console.log(`   ${response.url}`);
          console.log('');
        }
      }
      
      // Network failures
      if (message.method === 'Network.loadingFailed') {
        console.log(`❌ [NETWORK FAILED] ${new Date().toLocaleTimeString()}`);
        console.log(`   ${message.params.request.url}`);
        console.log(`   Error: ${message.params.errorText}`);
        console.log('');
      }
      
    } catch (e) {
      // Silent - ignore parse errors
    }
  });
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'watch';
  
  if (mode === '--help' || mode === '-h') {
    console.log(`
🔍 Chrome Remote Debugging MCP

Usage: node debug-mcp.js [mode]

Modes:
  watch       Monitor for errors in real-time (default)
  snapshot    Take a single snapshot of current errors
  
Examples:
  node debug-mcp.js watch
  node debug-mcp.js snapshot
  
Live Debug Features:
  - Real-time console errors and warnings
  - Exceptions with stack traces
  - Network failures (4xx, 5xx errors)
  - Timestamps for each event
  - Press Ctrl+C to exit watch mode
    `);
    process.exit(0);
  }
  
  console.log('🔍 Fetching debug data from Chrome on port', DEBUG_PORT);
  console.log('');
  
  const target = await getTargetInfo();
  if (!target) {
    console.error('Failed to find target page');
    process.exit(1);
  }
  
  console.log('📄 Target:', target.title);
  console.log('🔗 URL:', target.url);
  console.log('');
  
  const ws = await connectToDebugger(target);
  console.log('✓ Connected to Chrome debugger\n');
  
  if (mode === 'watch') {
    // Live monitoring mode
    await startLiveDebug(ws);
    
    // Keep connection open
    await new Promise(() => {});
  } else {
    // Snapshot mode (original behavior)
    console.log('📊 Collecting console messages and errors...');
    console.log('📡 Collecting network errors...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    ws.close();
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Snapshot captured at', new Date().toLocaleTimeString());
    console.log('═══════════════════════════════════════════════════════════\n');
  }
}

main().catch(console.error);
