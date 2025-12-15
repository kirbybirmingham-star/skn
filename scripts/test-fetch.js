import fetch from 'node-fetch';

const url = process.argv[2];
if (!url) { console.error('Usage: node test-fetch.js <url>'); process.exit(1); }

(async () => {
  try {
    const res = await fetch(url, { redirect: 'follow', timeout: 15000 });
    console.log('status', res.status);
    console.log('content-type', res.headers.get('content-type'));
    const buf = await res.arrayBuffer();
    console.log('bytes', buf.byteLength);
    // print first bytes
    const view = new Uint8Array(buf.slice(0, 64));
    console.log('head:', Array.from(view).map(b => b.toString(16).padStart(2,'0')).join(' '));
  } catch (err) {
    console.error('fetch error', err.message);
  }
})();
