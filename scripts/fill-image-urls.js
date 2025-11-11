import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars. Aborting.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // fetch products that have null image_url
  const { data: products, error } = await supabase
    .from('products')
    .select('id,slug,title,image_url')
    .is('image_url', null)
    .limit(100);

  if (error) {
    console.error('Error fetching products:', error);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('No products with null image_url found.');
    return;
  }

  const bucket = 'listings-images';
  for (const p of products) {
    const slug = p.slug;
    try {
      const { data: files, error: listErr } = await supabase.storage.from(bucket).list(`products/${slug}`, { limit: 100 });
      if (listErr) {
        console.warn(`Failed to list storage for ${slug}:`, listErr.message || listErr);
        continue;
      }
      const hasMain = files && files.some(f => f.name === 'main.jpg');
      if (!hasMain) {
        console.log(`No main.jpg found in storage for ${slug}, skipping.`);
        continue;
      }
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/products/${slug}/main.jpg`;
      const { data, error: updateErr } = await supabase
        .from('products')
        .update({ images: images })
        .eq('slug', slug)
        .select();
      if (updateErr) {
        console.warn(`Failed to update product ${slug}:`, updateErr.message || updateErr);
      } else {
        console.log(`Updated product ${slug} -> image_url set to ${images}`);
      }
    } catch (err) {
      console.error(`Error processing ${slug}:`, err.message || err);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
