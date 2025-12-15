import 'dotenv/config.js';
import dotenv from 'dotenv';
import path from 'path';

// Also load .env.local if present (we often store keys there)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import fetch from 'node-fetch';
import fs from 'fs';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REPORTS_DIR = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: false, limit: 100, onlyPlaceholders: false, perPage: 3 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--only-placeholders') opts.onlyPlaceholders = true;
    else if (a === '--apply') opts.dryRun = false;
    else if (a === '--limit') opts.limit = Number(args[i + 1]) || opts.limit;
    else if (a === '--per-page') opts.perPage = Number(args[i + 1]) || opts.perPage;
    else if (a === '--with-google') opts.withGoogle = true;
    else if (a === '--with-commons') opts.withCommons = true;
    else if (a === '--no-pexels') opts.noPexels = true;
    else if (a === '--with-unsplash') opts.withUnsplash = true;
    else if (a === '--use-full-title') opts.useFullTitle = true;
    else if (a === '--marketplace') opts.marketplace = true;
    else if (a === '--only-suitable') opts.onlySuitable = true;
  }
  return opts;
}

function scoreCandidate(c, product, searchTerm) {
  let score = 0;
  const sourceWeights = { pexels: 3, unsplash: 3, commons: 1, google: 1 };
  if (c.source && sourceWeights[c.source]) score += sourceWeights[c.source];

  const text = `${c.url || ''} ${c.photographer || ''} ${JSON.stringify(c.src || {})} ${searchTerm || ''}`.toLowerCase();
  const productKeywords = ['product', 'studio', 'flat', 'flatlay', 'on white', 'white background', 'isolated', 'product shot', 'packaging', 'jar', 'bottle', 'box', 'close-up', 'macro', 'still life', 'product photography', 'studio shot', 'packshot'];
  for (const kw of productKeywords) {
    if (text.includes(kw)) score += 2;
  }

  // prefer direct large/original images
  if (c.src && (c.src.original || c.src.large || c.src.full || c.src.raw)) score += 1;

  // penalize Commons slightly (unless product keywords found)
  if (c.source === 'commons' && !productKeywords.some(k => text.includes(k))) score -= 1;

  return score;
}

function isPlaceholderUrl(url) {
  if (!url) return true; // treat missing as placeholder
  const placeholders = ['dicebear', 'ui-avatars', 'picsum', 'placehold', 'placeholder', 'images.unsplash.com', 'source.unsplash.com', 'avatars.dicebear.org'];
  const lower = url.toLowerCase();
  return placeholders.some(p => lower.includes(p));
}

function cleanSearchTerm(title, slug) {
  const removeRe = /\b(blend|powder|necklace|dress|speaker|beans|sauce|honey|bread|coffee|pasta|ginger|mango|powder|seasoning|charger|cable|wireless|bluetooth|speaker)\b/gi;
  const s = (title || slug || '').replace(removeRe, '').replace(/[-_]/g, ' ').trim();
  return s || title || slug;
}

async function searchPexels(query, perPage = 3) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error('PEXELS_API_KEY not set in environment');
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;
  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pexels search failed ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json.photos || [];
}

async function searchGoogle(query, perPage = 3) {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) throw new Error('GOOGLE_API_KEY or GOOGLE_CSE_ID not set in environment');
  // Try with rights filter first (Creative Commons), fall back to no-rights if Google returns 400
  const rightsParam = 'cc_publicdomain,cc_attribution';
  let url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${key}&searchType=image&num=${perPage}&rights=${encodeURIComponent(rightsParam)}`;
  let res = await fetch(url);
  if (res.status === 400) {
    // Retry without rights filter
    url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${key}&searchType=image&num=${perPage}`;
    res = await fetch(url);
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google CSE failed ${res.status}: ${txt}`);
  }

  const json = await res.json();
  const items = json.items || [];
  return items.map(it => ({
    id: it.cacheId || it.link,
    url: it.image?.contextLink || it.link,
    photographer: it.displayLink || it.title,
    src: { original: it.link }
  }));
}

async function searchCommons(query, perPage = 3) {
  // Use Wikimedia Commons search (no key required) and return file URLs and license info
  const api = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=${perPage}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;
  const res = await fetch(api);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Commons search failed ${res.status}: ${txt}`);
  }
  const json = await res.json();
  const pages = json.query?.pages || {};
  const items = Object.values(pages).map(p => {
    const ii = (p.imageinfo && p.imageinfo[0]) || {};
    return {
      id: p.pageid,
      url: ii.descriptionurl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.title)}`,
      photographer: (ii.extmetadata && (ii.extmetadata.Artist?.value || ii.extmetadata.Author?.value)) || p.title,
      src: { original: ii.url }
    };
  });
  return items;
}

async function searchUnsplash(query, perPage = 3) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    // fallback to source.unsplash.com (no API key) - return a single featured URL per query
    return [{ id: `source-${query}`, url: `https://source.unsplash.com/featured/?${encodeURIComponent(query)}`, photographer: 'unsplash-source', src: { original: `https://source.unsplash.com/featured/?${encodeURIComponent(query)}` } }];
  }

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Unsplash search failed ${res.status}: ${txt}`);
  }
  const json = await res.json();
  return (json.results || []).map(r => ({ id: r.id, url: r.links.html, photographer: r.user?.name, src: { original: r.urls?.raw || r.urls?.full || r.urls?.regular } }));
}

async function run() {
  const opts = parseArgs();
  console.log('Pexels dry-run script\nOptions:', opts);

  // get products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, slug, image_url, vendor_id')
    .order('title');

  if (error) throw error;

  const toProcess = opts.onlyPlaceholders
    ? products.filter(p => isPlaceholderUrl(p.image_url))
    : products;

  console.log(`Found ${products.length} products, processing ${toProcess.length} (limit ${opts.limit})`);

  const results = [];
  const BUCKET = 'listings-images';

  const applyResults = [];

  // If running in apply mode, write a backup of current image_url values for the set we will process
  if (!opts.dryRun) {
    try {
      const preview = toProcess.slice(0, opts.limit).map(p => ({ id: p.id, slug: p.slug, title: p.title, vendor_id: p.vendor_id, image_url: p.image_url || null }));
      const backupPath = path.join(REPORTS_DIR, `pexels-backup-before-apply-${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify({ generatedAt: new Date().toISOString(), preview }, null, 2));
      console.log(`🔒 Preflight backup written to ${backupPath}`);
    } catch (err) {
      console.warn('⚠️ Failed to write preflight backup:', err.message);
    }
  }

  for (let i = 0; i < Math.min(toProcess.length, opts.limit); i++) {
    const p = toProcess[i];
    console.log(`\n[${i + 1}/${Math.min(toProcess.length, opts.limit)}] ${p.slug} - ${p.title}`);
    const searchTerm = opts.useFullTitle ? (p.title || p.slug) : cleanSearchTerm(p.title, p.slug);
    console.log(`  Search term: "${searchTerm}"`);

    try {
      let photos = [];
      if (!opts.noPexels) {
        try {
          photos = await searchPexels(searchTerm, opts.perPage);
        } catch (err) {
          console.warn('  ⚠️ Pexels search failed/skipped:', err.message);
          photos = [];
        }
      } else {
        console.log('  ℹ️ Skipping Pexels search (disabled)');
      }

      if (!photos.length && !opts.withGoogle && !opts.withCommons && !opts.withUnsplash) {
        console.log('  ❌ No photos found (no sources enabled)');
        results.push({ product: p, found: false, candidates: [] });
        continue;
      }

      let candidates = photos.map(photo => ({
        id: photo.id,
        url: photo.url,
        photographer: photo.photographer,
        src: photo.src,
        source: 'pexels'
      }));

      // If Pexels didn't find anything or explicit flags provided, try other sources
      if (opts.withGoogle) {
        try {
          const g = await searchGoogle(searchTerm, opts.perPage);
          if (g && g.length) {
            console.log(`  ℹ️ Google returned ${g.length} candidate(s)`);
            candidates = candidates.concat(g.map(c => ({ ...c, source: 'google' })));
          }
        } catch (err) {
          console.warn('  ⚠️ Google search skipped:', err.message);
        }
      }

      if (opts.withCommons) {
        try {
          const c = await searchCommons(searchTerm, opts.perPage);
          if (c && c.length) {
            console.log(`  ℹ️ Commons returned ${c.length} candidate(s)`);
            candidates = candidates.concat(c.map(ci => ({ ...ci, source: 'commons' })));
          }
        } catch (err) {
          console.warn('  ⚠️ Commons search skipped:', err.message);
        }
      }

      if (opts.withUnsplash) {
        try {
          const u = await searchUnsplash(searchTerm, opts.perPage);
          if (u && u.length) {
            console.log(`  ℹ️ Unsplash returned ${u.length} candidate(s)`);
            candidates = candidates.concat(u.map(ci => ({ ...ci, source: 'unsplash' })));
          }
        } catch (err) {
          console.warn('  ⚠️ Unsplash search skipped:', err.message);
        }
      }

      console.log(`  ✅ Found ${candidates.length} candidate(s)`);

      // If marketplace scoring requested, score and pick top candidates
      let scored = [];
      if (opts.marketplace) {
        scored = candidates.map(c => ({ ...c, score: scoreCandidate(c, p, searchTerm) }));
        scored.sort((a, b) => b.score - a.score);
        console.log(`  🔎 Top candidate score: ${scored[0]?.score ?? 'n/a'}`);
        results.push({ product: p, found: true, candidates: scored });
      } else {
        results.push({ product: p, found: true, candidates });
      }

      // If apply mode and this product is eligible (only placeholders or all), perform the upload/update
      if (!opts.dryRun) {
        // If onlyPlaceholders flag set, skip non-placeholder images
        if (opts.onlyPlaceholders && !isPlaceholderUrl(p.image_url)) {
          console.log('  ⏭️ Skipping (not a placeholder)');
          applyResults.push({ product: p, skipped: true, reason: 'not-a-placeholder' });
        } else if (!candidates.length) {
          console.log('  ❌ No candidates to apply');
          applyResults.push({ product: p, skipped: true, reason: 'no-candidates' });
        } else {
          const list = opts.marketplace ? candidates : candidates;
          const chosen = opts.marketplace ? list[0] : candidates[0];

          // If onlySuitable, enforce minimum score
          if (opts.onlySuitable && opts.marketplace && (chosen.score == null || chosen.score < 3)) {
            console.log('  ⏭️ Skipping (no candidate meeting suitability threshold)');
            applyResults.push({ product: p, skipped: true, reason: 'not-suitable', topScore: chosen.score || 0 });
            continue;
          }
          const srcUrl = chosen.src.original || chosen.src.large || chosen.src.medium || chosen.src.small;
          console.log(`  ▶ Applying candidate ${chosen.id} by ${chosen.photographer}`);

          try {
            // Before we overwrite the storage object, try to back up the current file (if any)
            try {
              const { data: existingData, error: existingError } = await supabase.storage.from(BUCKET).download(storagePath);
              if (!existingError && existingData) {
                const existingBuf = Buffer.from(await existingData.arrayBuffer());
                const backupPath = `backups/vendors/${vendor}/products/${p.slug}/${Date.now()}.jpg`;
                const { error: bkErr } = await supabase.storage.from(BUCKET).upload(backupPath, existingBuf, { upsert: true, contentType: 'image/jpeg' });
                if (bkErr) console.warn('  ⚠️ Backup upload failed:', bkErr.message);
                else console.log(`  🔒 Existing image backed up to ${backupPath}`);
              }
            } catch (err) {
              console.warn('  ⚠️ Pre-upload backup check failed:', err.message);
            }

            const dl = await fetch(srcUrl, { timeout: 15000 });
            if (!dl.ok) throw new Error(`download failed ${dl.status}`);
            const buffer = await dl.buffer();

            // Optimize
            let optimized = buffer;
            try {
              optimized = await sharp(buffer)
                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 85, progressive: true })
                .toBuffer();
            } catch (err) {
              console.warn('  ⚠️ Image optimization failed, using original buffer');
            }

            // storage path
            const vendor = p.vendor_id || 'unknown-vendor';
            const storagePath = `vendors/${vendor}/products/${p.slug}/main.jpg`;

            const { error: uploadError } = await supabase.storage
              .from(BUCKET)
              .upload(storagePath, optimized, { upsert: true, contentType: 'image/jpeg' });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
            const publicUrl = data?.publicUrl || null;

            if (!publicUrl) throw new Error('no public url after upload');

            // Update DB and record previous value
            const prev = p.image_url || null;
            const { error: updateError } = await supabase
              .from('products')
              .update({ image_url: publicUrl })
              .eq('id', p.id);

            if (updateError) throw updateError;

            console.log(`  ✅ Applied and updated DB -> ${publicUrl}`);
            applyResults.push({ product: p, applied: true, prevImage: prev, newImage: publicUrl, chosen });
          } catch (err) {
            console.error(`  ❌ Apply failed: ${err.message}`);
            applyResults.push({ product: p, applied: false, error: err.message });
          }
        }
      }

      // Rate limit friendly pause
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`  ❌ Error searching: ${err.message}`);
      results.push({ product: p, found: false, error: err.message, candidates: [] });
    }
  }

  const outPath = path.join(REPORTS_DIR, `pexels-dryrun-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), opts, results }, null, 2));
  console.log(`\n🔖 Dry-run report written to ${outPath}`);

  // Also create a simple markdown preview
  const previewPath = path.join(REPORTS_DIR, `pexels-dryrun-preview-${Date.now()}.md`);
  const md = [];
  md.push('# Pexels Dry-run Preview\n');
  md.push(`Generated: ${new Date().toISOString()}\n`);
  for (const r of results) {
    const p = r.product;
    md.push(`## ${p.slug} — ${p.title}`);
    md.push(`Current image: ${p.image_url || '*none*'}`);
    if (!r.found) {
      md.push('- No candidates found');
    } else {
      for (const c of r.candidates) {
        md.push(`- Photo: ${c.url}`);
        md.push(`  - Photographer: ${c.photographer}`);
        md.push(`  - Src (large): ${c.src.large || c.src.original || c.src.medium}`);
      }
    }
    md.push('\n');
  }
  fs.writeFileSync(previewPath, md.join('\n'));
  console.log(`🔖 Preview markdown written to ${previewPath}`);

  if (!opts.dryRun) {
    const applyPath = path.join(REPORTS_DIR, `pexels-apply-${Date.now()}.json`);
    fs.writeFileSync(applyPath, JSON.stringify({ generatedAt: new Date().toISOString(), opts, applyResults }, null, 2));
    console.log(`🔖 Apply report written to ${applyPath}`);

    const applied = applyResults.filter(r => r.applied).length;
    const failed = applyResults.filter(r => r.applied === false).length;
    const skipped = applyResults.filter(r => r.skipped).length;
    console.log(`\n📊 Apply results: ✅ Applied: ${applied}, ❌ Failed: ${failed}, ⏭️ Skipped: ${skipped}`);
  }

  console.log('\nDone. Review the report and let me know which items you want to apply.');
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
