import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

// Load env from repository root (works in CI and locally)
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars. Aborting.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const slugs = ['laptop','t-shirt','coffee-mug','smartphone','jeans'];
  const { data, error } = await supabase
    .from('products')
    .select('id,slug,title,image_url,gallery_images')
    .in('slug', slugs);

  if (error) {
    console.error('Error querying products:', error);
    process.exit(1);
  }

  for (const row of data) {
    console.log('---');
    console.log('slug:', row.slug);
    console.log('title:', row.title);
    console.log('image_url:', row.image_url);
    console.log('gallery_images:', JSON.stringify(row.gallery_images));
    // Check storage objects for this product
    try {
      const bucket = 'listing-images';
      const prefix = `products/${row.slug}/`;
      const { data: files, error: listErr } = await supabase.storage.from(bucket).list(`products/${row.slug}`, { limit: 100 });
      if (listErr) {
        console.warn('  storage list error:', listErr.message || listErr);
      } else {
        console.log('  storage objects:');
        if (!files || files.length === 0) console.log('   (none)');
        else files.forEach(f => console.log('   -', f.name, f.updated_at || ''));
      }
    } catch (err) {
      console.warn('  Error checking storage:', err.message || err);
    }
  }

  const found = data.map(d => d.slug);
  for (const s of slugs) {
    if (!found.includes(s)) console.warn(`Product missing in DB: ${s}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
