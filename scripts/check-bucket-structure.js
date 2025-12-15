import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkBucketStructure() {
  console.log('📁 Checking listings-images bucket structure...\n');

  try {
    // List all items in products folder
    const { data: productsFolder, error: productsError } = await supabase.storage
      .from('listings-images')
      .list('products');

    if (productsError) {
      console.error('❌ Error listing products folder:', productsError);
      return;
    }

    console.log('📦 Items in products folder:');
    if (productsFolder && productsFolder.length > 0) {
      for (const item of productsFolder) {
        console.log(`  ${item.id} (${item.metadata?.mimetype || 'folder'})`);
        
        // If it's a folder, list its contents
        if (!item.metadata?.mimetype) {
          const { data: subItems, error: subError } = await supabase.storage
            .from('listings-images')
            .list(`products/${item.name}`);
          
          if (!subError && subItems) {
            console.log(`    └─ Contains ${subItems.length} items:`);
            for (const subItem of subItems) {
              console.log(`      - ${subItem.name} (${subItem.metadata?.mimetype || 'folder'})`);
            }
          }
        }
      }
    } else {
      console.log('  (empty)');
    }

    // Check vendors folder
    console.log('\n📦 Items in vendors folder:');
    const { data: vendorsFolder, error: vendorsError } = await supabase.storage
      .from('listings-images')
      .list('vendors');

    if (!vendorsError && vendorsFolder) {
      for (const item of vendorsFolder) {
        console.log(`  ${item.name} (${item.metadata?.mimetype || 'folder'})`);
      }
    } else {
      console.log('  (empty or error)');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkBucketStructure();
