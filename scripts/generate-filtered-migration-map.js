import fs from 'fs';
import fetch from 'node-fetch';

const inPath = './reports/migration-dryrun.json';
const outPath = './migration-map.json';

if (!fs.existsSync(inPath)) { console.error('input not found', inPath); process.exit(1); }
const data = JSON.parse(fs.readFileSync(inPath,'utf8'));
const migrations = data.migrations || [];

(async ()=>{
  const ok = [];
  for (const m of migrations) {
    const src = m.match && m.match.source;
    if (!src) continue;
    try {
      const res = await fetch(src, { redirect: 'follow', timeout: 15000 });
      if (!res.ok) { console.log('skip (not ok):', m.slug, res.status); continue; }
      const ct = res.headers.get('content-type') || '';
      if (!/image\//i.test(ct) && !/svg\+xml/i.test(ct)) { console.log('skip (not image):', m.slug, ct); continue; }
      const ab = await res.arrayBuffer();
      const buf = Buffer.from(ab);
      // We'll embed currentImageUrl and keep newPath
      ok.push({ productId: m.productId, productSlug: m.slug, vendorId: m.vendorId, currentImageUrl: m.match.source, newPath: m.newPath, _contentType: ct, _size: buf.length });
      console.log('accept:', m.slug, ct, buf.length);
    } catch (err) {
      console.log('error checking:', m.slug, err.message);
    }
  }
  const out = { timestamp: new Date().toISOString(), migrations: ok };
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('Wrote', outPath, 'with', ok.length, 'entries');
})();
