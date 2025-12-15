import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { getProductMainImagePath, getPublicUrl } from '../src/lib/storagePathBuilder.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'listings-images';
const supabaseUrl = process.env.VITE_SUPABASE_URL;

function isPlaceholder(url) {
  if (!url) return true;
  const u = url.toLowerCase();
  return (
    u.includes('dicebear') ||
    u.includes('ui-avatars') ||
    u.startsWith('data:image') ||
    u.includes('placeholder.com') ||
    u.includes('gradient') ||
    u.includes('placeholder')
  );
}

function unsplashSource(term) {
  return `https://source.unsplash.com/1200x900/?${encodeURIComponent(term)}`;
}

async function downloadImage(url) {
  try {
    // Unsplash Source responds with a 302 to a CDN image; fetch will follow redirect
    const res = await fetch(url, { redirect: 'follow', timeout: 15000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch (err) {
    console.error('  downloadImage error:', err.message || err);
    return null;
  }
}

async function optimize(buffer) {
  try {
    const out = await sharp(buffer)
      .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
    return out;
  } catch (err) {
    console.warn('  sharp optimization failed, using original:', err.message || err);
    return buffer;
  }
}

async function run() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(dryRun ? 'DRY RUN: will not upload or update DB' : 'Running: will upload and update DB');
  console.log('Finding products with placeholder images...\n');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, slug, vendor_id, image_url')
    .order('title');

  if (error) {
    console.error('Error fetching products:', error.message || error);
    process.exit(1);
  }

  const toProcess = products.filter(p => isPlaceholder(p.image_url) || !p.image_url || p.image_url === null);

  console.log(`Products to process: ${toProcess.length}\n`);

  const report = { timestamp: new Date().toISOString(), total: toProcess.length, items: [] };

  for (let i = 0; i < toProcess.length; i++) {
    const p = toProcess[i];
    console.log(`[${i + 1}/${toProcess.length}] ${p.slug} — ${p.title}`);

    const searchTerm = p.title || p.slug;
    const srcUrl = unsplashSource(searchTerm);
    console.log(`  Search URL: ${srcUrl}`);

    const buffer = await downloadImage(srcUrl);
    if (!buffer) {
      console.log('  ❌ Failed to download image');
      report.items.push({ slug: p.slug, status: 'download_failed' });
      continue;
    }

    console.log(`  ✓ Downloaded (${(buffer.length/1024).toFixed(1)}KB)`);
    const optimized = await optimize(buffer);
    console.log(`  ✓ Optimized (${(optimized.length/1024).toFixed(1)}KB)`);

    const newPath = getProductMainImagePath(p.vendor_id, p.slug);
    const publicUrl = getPublicUrl(supabaseUrl, BUCKET, newPath);

    report.items.push({ slug: p.slug, source: srcUrl, newPath, publicUrl });

    if (dryRun) {
      console.log(`  [DRY] Would upload to: ${newPath}`);
    } else {
      console.log('  Uploading...');
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, optimized, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) {
        console.log('  ❌ Upload failed:', uploadError.message || uploadError);
        report.items[report.items.length-1].status = 'upload_failed';
        continue;
      }

      console.log('  ✓ Uploaded');

      // Update DB
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', p.id);

      if (updateError) {
        console.log('  ❌ DB update failed:', updateError.message || updateError);
        report.items[report.items.length-1].status = 'db_update_failed';
        continue;
      }

      console.log('  ✓ DB updated');
      report.items[report.items.length-1].status = 'ok';

      // small delay to be polite
      await new Promise(r => setTimeout(r, 600));
    }

    console.log('');
  }

  const outDir = path.resolve('./reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, dryRun ? 'unsplash-dryrun-report.json' : 'unsplash-migration-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(`Saved report: ${outPath}`);
  console.log('Done.');
}

run().catch(err => { console.error('Fatal error:', err); process.exit(1); });
