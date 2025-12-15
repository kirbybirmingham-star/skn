import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('📊 Current image status for all products\n');

  const { data: products } = await supabase
    .from('products')
    .select('id, title, slug, image_url')
    .order('title');

  const byType = {
    svg: [],
    dicebear: [],
    uiavatar: [],
    gradient: [],
    datauri: [],
    http: [],
    other: []
  };

  for (const p of products) {
    const url = p.image_url || '';
    if (url.includes('svg+xml') || url.includes('svg?')) byType.svg.push(p);
    else if (url.includes('dicebear')) byType.dicebear.push(p);
    else if (url.includes('ui-avatars')) byType.uiavatar.push(p);
    else if (url.includes('gradient')) byType.gradient.push(p);
    else if (url.startsWith('data:')) byType.datauri.push(p);
    else if (url.startsWith('http')) byType.http.push(p);
    else byType.other.push(p);
  }

  console.log(`✅ HTTP/S URLs (real images): ${byType.http.length}`);
  byType.http.slice(0, 3).forEach(p => console.log(`   - ${p.slug}`));

  console.log(`\n🎨 SVG placeholders: ${byType.svg.length}`);
  byType.svg.forEach(p => console.log(`   - ${p.slug}`));

  console.log(`\n🎭 DiceBear avatars: ${byType.dicebear.length}`);
  byType.dicebear.slice(0, 3).forEach(p => console.log(`   - ${p.slug}`));

  console.log(`\n👤 UI Avatars: ${byType.uiavatar.length}`);
  console.log(`🌈 Gradients: ${byType.gradient.length}`);
  console.log(`📦 Data URIs: ${byType.datauri.length}`);
  console.log(`❓ Other: ${byType.other.length}`);

  console.log(`\n📈 Total: ${products.length}`);
}

check();
