import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { getProductMainImagePath } from '../src/lib/storagePathBuilder.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);
const SOURCE_BUCKET = 'skn-bridge-assets';
const DEST_BUCKET = 'listings-images';

function slugify(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function runDryRun() {
  console.log('🔍 Building migration mapping (dry-run)');

  // fetch products
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, title, slug, vendor_id, image_url, gallery_images');

  if (prodError) {
    console.error('Error fetching products:', prodError.message || prodError);
    process.exit(1);
  }

  // list source bucket files
  const { data: sourceFiles, error: listError } = await supabase.storage
    .from(SOURCE_BUCKET)
    .list('', { recursive: true, limit: 5000 });

  if (listError) {
    console.error('Error listing source bucket:', listError.message || listError);
    process.exit(1);
  }

  const fileNames = (sourceFiles || []).map(f => f.name.toLowerCase());

  const migrations = [];

  for (const p of products) {
    const slug = p.slug;
    const sku = slugify(p.title || slug);
    const vendorId = p.vendor_id;
    const productId = p.id;

    let matched = null;

    // 1) Prefer gallery image URL if it's in skn-bridge-assets or an http URL
    if (p.gallery_images && p.gallery_images.length > 0) {
      const url = p.gallery_images[0];
      if (url && url.includes('.supabase.co')) {
        matched = { type: 'external_url', source: url };
      }
    }

    // 2) If not matched, try matching by filename containing slug or title words
    if (!matched) {
      // try exact slug match in filenames
      const found = fileNames.find(n => n.includes(slug.toLowerCase()));
      if (found) {
        matched = { type: 'storage_path', source: found };
      } else {
        // try title words
        const words = (p.title || '').toLowerCase().split(/\s+/).filter(Boolean);
        for (const w of words) {
          const f = fileNames.find(n => n.includes(w) && !n.includes('avatar'));
          if (f) { matched = { type: 'storage_path', source: f }; break; }
        }
      }
    }

    // 3) Fallback: if image_url points to a storage path, use that
    if (!matched && p.image_url && p.image_url.includes('.supabase.co')) {
      matched = { type: 'external_url', source: p.image_url };
    }

    const newPath = getProductMainImagePath(vendorId, slug);

    migrations.push({
      productId,
      slug,
      vendorId,
      match: matched,
      newPath,
    });
  }

  const report = {
    timestamp: new Date().toISOString(),
    sourceBucket: SOURCE_BUCKET,
    destBucket: DEST_BUCKET,
    totalProducts: products.length,
    migrations,
  };

  const outDir = path.resolve('./reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'migration-dryrun.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(`Saved dry-run mapping to ${outPath}`);

  // Print concise summary
  const toCopy = migrations.filter(m => m.match !== null);
  const noMatch = migrations.filter(m => m.match === null);
  console.log(`\nSummary:`);
  console.log(`  Products with a source match: ${toCopy.length}`);
  console.log(`  Products without match: ${noMatch.length}`);

  console.log('\nExamples (first 10 matches):');
  toCopy.slice(0, 10).forEach(m => {
    console.log(` - ${m.slug} -> ${m.match.type} -> ${m.match.source} -> ${m.newPath}`);
  });

  console.log('\nProducts without match (first 10):');
  noMatch.slice(0, 10).forEach(m => console.log(` - ${m.slug}`));
}

runDryRun().catch(err => { console.error('Fatal error:', err); process.exit(1); });
