import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBucket() {
  console.log('📦 Checking listings-images bucket...\n');

  try {
    const { data, error } = await supabase.storage
      .from('listings-images')
      .list('', { recursive: true });

    if (error) throw error;

    console.log(`✓ Total items: ${data.length}\n`);

    // Group by folder
    const folders = {};
    data.forEach(item => {
      const parts = item.name.split('/');
      const folder = parts[0];
      if (!folders[folder]) folders[folder] = [];
      folders[folder].push({
        name: item.name,
        size: item.metadata?.size || 0
      });
    });

    // Display by folder
    for (const [folder, items] of Object.entries(folders)) {
      console.log(`\n📁 ${folder}/ (${items.length} items)`);
      items.forEach(item => {
        const sizeKB = (item.size / 1024).toFixed(1);
        console.log(`   - ${item.name} (${sizeKB}KB)`);
      });
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkBucket();
