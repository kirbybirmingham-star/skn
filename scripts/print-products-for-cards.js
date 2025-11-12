import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Fetching products (same shape that listing receives)...');
  try {
    // Explicitly request the fields the product cards expect. If product_ratings doesn't exist
    // the select will fail; in that case retry without product_ratings.
    // Start with safe explicit product columns (avoid nested relation selects that can cause errors)
    let selectStr = `id, title, slug, vendor_id, base_price, currency, image_url, images, gallery_images, is_published, ribbon_text`;
    let res = await supabase.from('products').select(selectStr).order('created_at', { ascending: false }).range(0, 4);
    const { data, error } = res;
    if (error) {
      console.error('Products query failed:', error);
      return;
    }
    console.log('Returned rows:', (data || []).length);
    data.forEach((p, i) => {
      console.log(`\n--- Product ${i+1} ---`);
      const subset = {
        id: p.id,
        title: p.title,
        slug: p.slug,
        vendor_id: p.vendor_id,
        base_price: p.base_price,
        currency: p.currency,
        image_url: p.image_url,
        images: p.images,
        gallery_images: p.gallery_images,
        product_variants: p.product_variants ? p.product_variants.map(v => ({ id: v.id, title: v.title, images: v.images })) : undefined,
        product_ratings: p.product_ratings,
        is_published: p.is_published,
        ribbon_text: p.ribbon_text,
      };
      console.log(JSON.stringify(subset, null, 2));
    });
  } catch (err) {
    console.error('Failed to fetch products:', err?.message || err);
  }
}

main().catch(console.error);
