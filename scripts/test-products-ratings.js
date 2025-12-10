import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Testing products select with product_ratings relation...');
  try {
    // Try a list of select shapes to handle missing columns/relations across schemas
    const selectCandidates = [
      'id, title, images, product_ratings(*)',
      'id, title, images',
      'id, title, gallery_images, product_ratings(*)',
      'id, title, gallery_images',
      'id, title'
    ];

    let res = null;
    for (const sel of selectCandidates) {
      try {
        res = await supabase.from('products').select(sel).limit(3);
        if (!res.error) break;
        const msg = String(res.error?.message || '');
        if (msg.includes('does not exist') || msg.includes('Could not find a relationship') || msg.includes('column')) {
          // try next candidate
          continue;
        } else {
          // unrecoverable error
          break;
        }
      } catch (e) {
        // try next
      }
    }

    if (!res || res.error) {
      console.error('Error from select after trying candidates:', res ? res.error : 'no result');
    } else {
      console.log('Success. Sample products:');
      console.log(JSON.stringify(res.data, null, 2));
    }
  } catch (err) {
    console.error('Unexpected failure:', err.message || err);
  }
}

main().catch(console.error);
