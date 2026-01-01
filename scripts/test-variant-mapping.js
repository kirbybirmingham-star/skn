import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('Missing SUPABASE env'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, images, gallery_images, product_variants(id, name, images)')
    .limit(5);
  if (error) { console.error('Fetch failed:', error); process.exit(1); }

  const mapped = data.map(p => {
    if (Array.isArray(p.product_variants) && Array.isArray(p.images) && p.images.length > 0) {
      p.product_variants = p.product_variants.map(v => {
        if (!v.images || (Array.isArray(v.images) && v.images.length === 0)) {
          return { ...v, images: p.images };
        }
        return v;
      });
    }
    return p;
  });

  console.log('Mapped products sample:');
  console.log(JSON.stringify(mapped, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });
