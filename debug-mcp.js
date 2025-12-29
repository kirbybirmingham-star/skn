import https from 'https';
import http from 'http';
import WebSocket from 'ws';

const DEBUG_PORT = 9222;
const TARGET_URL = 'http://localhost:3000/';

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

async function connectToDebugger(target) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    
    ws.on('open', () => {
      console.log('✓ Connected to Chrome debugger');
      resolve(ws);
    });
    
    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
      reject(err);
    });
  });
}

async function enableConsoleLogging(ws) {
  return new Promise((resolve) => {
    let consoleMessages = [];
    let messageId = 1;
    
    // Enable console domain
    ws.send(JSON.stringify({
      id: messageId++,
      method: 'Runtime.enable'
    }));
    
    ws.send(JSON.stringify({
      id: messageId++,
      method: 'Console.enable'
    }));
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.method === 'Console.messageAdded') {
          const msg = message.params.message;
          consoleMessages.push({
            level: msg.level,
            text: msg.text,
            source: msg.source,
            lineNumber: msg.lineNumber,
            url: msg.url,
            timestamp: new Date(msg.timestamp).toLocaleString()
          });
        }
        
        if (message.method === 'Runtime.exceptionThrown') {
          const ex = message.params.exceptionDetails;
          consoleMessages.push({
            level: 'error',
            text: ex.text,
            description: ex.exception?.description,
            url: ex.url,
            lineNumber: ex.lineNumber,
            columnNumber: ex.columnNumber,
            timestamp: new Date().toLocaleString(),
            isException: true
          });
        }
      } catch (e) {
        // Silent
      }
    });
    
    // Give it a moment to collect messages, then resolve
    setTimeout(() => {
      resolve(consoleMessages);
    }, 2000);
  });
}

async function getNetworkErrors(ws) {
  return new Promise((resolve) => {
    let networkData = [];
    let messageId = 100;
    
    ws.send(JSON.stringify({
      id: messageId++,
      method: 'Network.enable'
    }));
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.method === 'Network.responseReceived') {
          const response = message.params.response;
          if (response.status >= 400) {
            networkData.push({
              url: response.url,
              status: response.status,
              statusText: response.statusText,
              type: message.params.type,
              timestamp: new Date().toLocaleString()
            });
          }
        }
        
        if (message.method === 'Network.loadingFailed') {
          networkData.push({
            url: message.params.request.url,
            errorText: message.params.errorText,
            type: message.params.type,
            timestamp: new Date().toLocaleString()
          });
        }
      } catch (e) {
        // Silent
      }
    });
    
    setTimeout(() => {
      resolve(networkData);
    }, 2000);
  });
}

async function main() {
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
  
  console.log('📊 Collecting console messages and errors...');
  const consoleLogs = await enableConsoleLogging(ws);
  
  console.log('📡 Collecting network errors...');
  const networkErrors = await getNetworkErrors(ws);
  
  ws.close();
  
  // Display results
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 CONSOLE MESSAGES & ERRORS');
  console.log('═══════════════════════════════════════════════════════════');
  
  if (consoleLogs.length === 0) {
    console.log('✓ No console errors or warnings detected');
  } else {
    consoleLogs.forEach((msg, i) => {
      const icon = msg.level === 'error' ? '❌' : msg.level === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`\n${icon} [${msg.level.toUpperCase()}] ${msg.timestamp}`);
      console.log(`   ${msg.text}`);
      if (msg.url) console.log(`   📍 ${msg.url}:${msg.lineNumber}`);
      if (msg.description) console.log(`   ${msg.description}`);
      if (msg.isException) console.log(`   ⚡ Exception thrown`);
    });
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🌐 NETWORK ERRORS (4xx, 5xx)');
  console.log('═══════════════════════════════════════════════════════════');
  
  if (networkErrors.length === 0) {
    console.log('✓ No network errors detected');
  } else {
    networkErrors.forEach((err, i) => {
      console.log(`\n❌ ${err.url}`);
      if (err.status) console.log(`   Status: ${err.status} ${err.statusText}`);
      if (err.errorText) console.log(`   Error: ${err.errorText}`);
      console.log(`   Type: ${err.type} | ${err.timestamp}`);
    });
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
