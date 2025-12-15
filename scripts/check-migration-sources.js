import fs from 'fs';
import fetch from 'node-fetch';

const report = JSON.parse(fs.readFileSync('./reports/migration-dryrun.json','utf8'));
const entries = report.migrations.slice(0,10);

(async ()=>{
  for (const e of entries) {
    const src = e.match && e.match.source;
    console.log('---', e.slug);
    if (!src) { console.log(' no source'); continue; }
    try {
      const res = await fetch(src, { redirect: 'follow', timeout: 15000 });
      console.log(' status', res.status);
      console.log(' content-type', res.headers.get('content-type'));
      const ab = await res.arrayBuffer();
      console.log(' bytes', ab.byteLength);
    } catch (err) {
      console.log(' fetch error', err.message);
    }
  }
})();
