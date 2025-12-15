import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';
import { getPlaceholderImage } from '../src/lib/placeholderResolver.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function assignPlaceholders() {
  console.log('🎨 Assigning placeholder images to products without uploads\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Get all products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, slug, image_url, vendor_id')
      .order('title');

    if (error) throw error;

    // Get bucket images
    const { data: bucketItems } = await supabase.storage
      .from('listings-images')
      .list('', { recursive: true });

    const bucketImages = new Set(
      bucketItems
        .map(item => item.name)
        .filter(name => !name.includes('/'))
        .map(name => name.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '').toLowerCase())
    );

    // Find products without bucket images
    const needPlaceholder = products.filter(p => !bucketImages.has(p.slug.toLowerCase()));

    console.log(`📊 Total products: ${products.length}`);
    console.log(`✅ With real images: ${bucketImages.size}`);
    console.log(`🎨 Need placeholders: ${needPlaceholder.length}\n`);

    if (needPlaceholder.length === 0) {
      console.log('✓ All products have images!\n');
      return;
    }

    // Available placeholder services
    const services = ['dicebear', 'uiavatar', 'gradient'];
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < needPlaceholder.length; i++) {
      const product = needPlaceholder[i];
      // Rotate through placeholder services for variety
      const service = services[i % services.length];
      
      console.log(`[${i + 1}/${needPlaceholder.length}] ${product.slug}`);
      console.log(`  Title: ${product.title}`);

      try {
        // Generate placeholder URL
        const placeholderUrl = getPlaceholderImage(product.slug, product.title, {
          service,
          size: 400
        });

        console.log(`  Service: ${service}`);
        console.log(`  Placeholder: ${placeholderUrl.substring(0, 70)}...`);

        // Update product with placeholder
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: placeholderUrl })
          .eq('id', product.id);

        if (updateError) {
          console.log(`  ❌ Update failed: ${updateError.message}`);
          failed++;
        } else {
          console.log(`  ✓ Updated with placeholder`);
          succeeded++;
        }
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
        failed++;
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n📊 Results:`);
    console.log(`  ✅ Updated: ${succeeded}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  🎨 Placeholder services used: ${services.join(', ')}\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

assignPlaceholders();
