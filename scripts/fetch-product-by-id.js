import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE URL or KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PRODUCT_ID = process.argv[2] || '185c65f0-2edc-4553-90a5-1ac0b972be06';

async function main() {
  console.log('Fetching product id', PRODUCT_ID);
  // Try a few variant projection shapes to handle schema differences (name vs title)
  const variantSelectCandidates = [
    'product_variants(id, name, images)',
    'product_variants(id, title, images)',
    'product_variants(*)'
  ];

  let res = null;
  // First try including product_ratings when possible
  for (const vs of variantSelectCandidates) {
    try {
      res = await supabase
        .from('products')
        .select(`*, ${vs}, product_ratings(*)`)
        .eq('id', PRODUCT_ID)
        .maybeSingle();
      if (!res.error) break;
      // If error points to missing relation, try next candidate
      const msg = String(res.error.message || '');
      if (msg.includes('Could not find a relationship') || msg.includes('does not exist')) {
        continue;
      } else {
        // non-recoverable error, break and report
        break;
      }
    } catch (e) {
      // try next candidate
    }
  }

  // If still error or no data, try without product_ratings
  if (!res || res.error || !res.data) {
    for (const vs of variantSelectCandidates) {
      try {
        res = await supabase
          .from('products')
          .select(`*, ${vs}`)
          .eq('id', PRODUCT_ID)
          .maybeSingle();
        if (!res.error) break;
        const msg = String(res.error.message || '');
        if (msg.includes('Could not find a relationship') || msg.includes('does not exist')) {
          continue;
        } else {
          break;
        }
      } catch (e) {
        // try next
      }
    }
  }

  if (!res || res.error) {
    console.error('Error fetching product:', res ? res.error : 'unknown error');
    process.exit(1);
  }

  console.log('Product object:');
  console.log(JSON.stringify(res.data, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });
