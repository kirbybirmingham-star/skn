import fs from 'fs';

const inPath = './reports/migration-dryrun.json';
const outPath = './migration-map.json';

if (!fs.existsSync(inPath)) {
  console.error('Dry-run report not found:', inPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const migrations = (data.migrations || []).map(m => {
  const obj = {
    productId: m.productId,
    productSlug: m.slug,
    vendorId: m.vendorId,
    newPath: m.newPath
  };
  if (m.match) {
    if (m.match.type === 'external_url') {
      obj.currentImageUrl = m.match.source;
    } else if (m.match.type === 'storage_path') {
      // stored path within source bucket; convert to path without bucket prefix
      obj.oldPath = m.match.source.replace(/^\/+/, '');
    }
  }
  return obj;
});

const out = { timestamp: new Date().toISOString(), migrations };
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log('Generated', outPath, 'with', migrations.length, 'entries');
