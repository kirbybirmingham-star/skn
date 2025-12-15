import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in env (VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);
const BUCKET = 'skn-bridge-assets';

async function scanBucket() {
  console.log('Scanning bucket:', BUCKET);
  try {
    const { data, error } = await supabase.storage.from(BUCKET).list('', { recursive: true, limit: 2000 });
    if (error) throw error;

    const report = {
      timestamp: new Date().toISOString(),
      bucket: BUCKET,
      totalItems: data.length,
      files: data.map(item => ({ name: item.name, metadata: item.metadata || null }))
    };

    // compute top-level folders and counts
    const topLevel = {};
    for (const f of data) {
      const top = f.name.split('/')[0] || f.name;
      if (!topLevel[top]) topLevel[top] = { count: 0, sample: [] };
      topLevel[top].count += 1;
      if (topLevel[top].sample.length < 5) topLevel[top].sample.push(f.name);
    }

    report.topLevel = topLevel;

    // ensure reports dir
    const outDir = path.resolve('./reports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const outPath = path.join(outDir, 'skn-bridge-assets-report.json');
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

    console.log(`Saved report: ${outPath}`);
    console.log(`Total items: ${report.totalItems}`);
    console.log('Top-level folders:');
    Object.entries(topLevel).forEach(([k, v]) => console.log(` - ${k}: ${v.count} items`));

  } catch (err) {
    console.error('Error scanning bucket:', err.message || err);
    process.exit(1);
  }
}

scanBucket();
