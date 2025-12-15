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

function unsplashUrl(term) {
  // Unsplash Source API: fetches a random image matching the search term
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(term)}`;
}

async function fetchImageFromUnsplash(term) {
  try {
    const url = unsplashUrl(term);
    const res = await fetch(url, {
      redirect: 'follow',
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch (err) {
    console.error(`    Unsplash fetch failed: ${err.message}`);
    return null;
  }
}

async function optimizeImage(buffer) {
  try {
    return await sharp(buffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
  } catch (err) {
    console.warn(`    Optimization failed: ${err.message}, using original`);
    return buffer;
  }
}

async function run() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(dryRun ? '🔍 DRY RUN: Searching for images' : '📥 Running: Fetching and uploading images');
  console.log('Finding products with SVG images...\n');

  // Get all products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, slug, vendor_id, image_url')
    .order('title');

  if (error) {
    console.error('Error fetching products:', error.message);
    process.exit(1);
  }

  // Filter products with SVG or placeholder content-type
  const svgProducts = products.filter(p => 
    p.image_url && (
      p.image_url.includes('svg') ||
      p.image_url.includes('image/svg+xml') ||
      p.image_url.startsWith('data:image/svg') ||
      p.image_url.includes('dicebear') ||
      p.image_url.includes('ui-avatars') ||
      p.image_url.includes('gradient') ||
      p.image_url.includes('placeholder')
    )
  );

  console.log(`📊 Products with SVG/placeholder images: ${svgProducts.length}\n`);

  const report = { timestamp: new Date().toISOString(), total: svgProducts.length, items: [] };
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < svgProducts.length; i++) {
    const p = svgProducts[i];
    console.log(`[${i + 1}/${svgProducts.length}] ${p.slug} — ${p.title}`);

    // Search term: use product title or slug
    const searchTerm = p.title || p.slug;
    console.log(`  🔍 Searching: "${searchTerm}"`);

    const buffer = await fetchImageFromUnsplash(searchTerm);
    if (!buffer) {
      console.log('  ❌ Failed to fetch image');
      report.items.push({ slug: p.slug, status: 'fetch_failed' });
      failed++;
      continue;
    }

    console.log(`  ✓ Downloaded (${(buffer.length / 1024).toFixed(1)}KB)`);

    const optimized = await optimizeImage(buffer);
    console.log(`  ✓ Optimized (${(optimized.length / 1024).toFixed(1)}KB)`);

    const newPath = getProductMainImagePath(p.vendor_id, p.slug);
    const publicUrl = getPublicUrl(supabaseUrl, BUCKET, newPath);

    report.items.push({ slug: p.slug, searchTerm, newPath, publicUrl });

    if (dryRun) {
      console.log(`  [DRY RUN] Would upload to: ${newPath}`);
    } else {
      console.log('  📤 Uploading...');
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, optimized, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) {
        console.log(`  ❌ Upload failed: ${uploadError.message}`);
        report.items[report.items.length - 1].status = 'upload_failed';
        failed++;
        continue;
      }

      console.log('  ✓ Uploaded to vendor folder');

      // Update product record
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', p.id);

      if (updateError) {
        console.log(`  ❌ DB update failed: ${updateError.message}`);
        report.items[report.items.length - 1].status = 'db_update_failed';
        failed++;
        continue;
      }

      console.log('  ✓ DB updated');
      report.items[report.items.length - 1].status = 'ok';
      succeeded++;

      // Rate limit
      await new Promise(r => setTimeout(r, 800));
    }

    console.log('');
  }

  const outDir = path.resolve('./reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, dryRun ? 'unsplash-svg-dryrun.json' : 'unsplash-svg-migration.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(`Saved report: ${outPath}`);
  console.log(`✅ Succeeded: ${succeeded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('Done.');
}

run().catch(err => { console.error('Fatal error:', err); process.exit(1); });
