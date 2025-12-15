import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBucketThoroughly() {
  console.log('📦 Deep scan of listings-images bucket\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // List all items recursively
    const { data, error } = await supabase.storage
      .from('listings-images')
      .list('', { recursive: true, limit: 1000 });

    if (error) throw error;

    console.log(`Total items found: ${data.length}\n`);

    // Separate files and folders
    const files = [];
    const folders = [];

    data.forEach(item => {
      if (item.metadata?.mimetype) {
        files.push({
          name: item.name,
          size: item.metadata.size,
          type: item.metadata.mimetype
        });
      } else {
        folders.push(item.name);
      }
    });

    console.log(`📂 Folders (${folders.length}):`);
    folders.forEach(f => console.log(`   ${f}`));

    console.log(`\n📄 Files (${files.length}):`);
    files.forEach(f => {
      const sizeKB = (f.size / 1024).toFixed(1);
      console.log(`   ${f.name} (${sizeKB}KB - ${f.type})`);
    });

    // Group files by pattern
    console.log(`\n🔍 File Analysis:`);

    // Product images
    const productImages = files.filter(f => 
      f.name.includes('product') || f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)
    );
    console.log(`\n  Product-related images: ${productImages.length}`);
    productImages.forEach(f => console.log(`    - ${f.name}`));

    // Vendor folder images
    const vendorImages = files.filter(f => f.name.includes('vendors/'));
    console.log(`\n  Vendor-organized images: ${vendorImages.length}`);
    vendorImages.forEach(f => console.log(`    - ${f.name}`));

    // Root level images
    const rootImages = files.filter(f => !f.name.includes('/'));
    console.log(`\n  Root level images: ${rootImages.length}`);
    rootImages.forEach(f => console.log(`    - ${f.name}`));

    // All other files
    const otherFiles = files.filter(f => 
      !f.name.includes('product') && 
      !f.name.includes('vendors/') && 
      !f.name.includes('/')
    );
    console.log(`\n  Other files: ${otherFiles.length}`);
    otherFiles.forEach(f => console.log(`    - ${f.name}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkBucketThoroughly();
