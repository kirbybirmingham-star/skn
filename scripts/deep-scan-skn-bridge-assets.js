import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);
const BUCKET = 'skn-bridge-assets';

async function listFolder(folder) {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).list(folder, { recursive: true, limit: 5000 });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error(`Error listing ${folder}:`, err.message || err);
    return [];
  }
}

async function run() {
  console.log('Deep scanning skn-bridge-assets: products/ and vendors/');
  const products = await listFolder('products');
  const vendors = await listFolder('vendors');

  const report = {
    timestamp: new Date().toISOString(),
    bucket: BUCKET,
    products: {
      count: products.length,
      items: products
    },
    vendors: {
      count: vendors.length,
      items: vendors
    }
  };

  const outDir = path.resolve('./reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'skn-bridge-assets-deep.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(`Saved deep report: ${outPath}`);
  console.log(`products/: ${report.products.count} items`);
  console.log(`vendors/: ${report.vendors.count} items`);
}

run();
