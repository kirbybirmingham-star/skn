import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateVendorCategorizations() {
  console.log('Updating existing vendor categorizations to remove inappropriate ones...');

  try {
    // Get existing vendors that need categorization updates
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name, slug, description, metadata')
      .not('slug', 'in', '(island-threads,tropical-bliss,caribbean-crafts,island-fresh)'); // Exclude Caribbean stores

    if (vendorError) {
      console.error('Error fetching vendors:', vendorError);
      return;
    }

    console.log(`Found ${vendors.length} existing vendors to update`);

    for (const vendor of vendors) {
      let updatedMetadata = { ...vendor.metadata };
      let updatedDescription = vendor.description;

      // Update vendor categorizations based on current inappropriate content
      if (vendor.slug === 'johns-general-store' || vendor.name.toLowerCase().includes('john')) {
        // John's General Store - appears to be a general store, which is fine
        updatedMetadata = {
          ...updatedMetadata,
          category: 'general-store',
          tags: ['general', 'essentials', 'local', 'variety']
        };
        updatedDescription = 'A neighborhood general store offering a wide variety of everyday essentials, fresh produce, and quality goods for the community.';
      } else if (vendor.slug === 'janes-gadgets' || vendor.name.toLowerCase().includes('jane')) {
        // Jane's Gadgets - technology/electronics store
        updatedMetadata = {
          ...updatedMetadata,
          category: 'electronics',
          tags: ['electronics', 'gadgets', 'technology', 'accessories']
        };
        updatedDescription = 'Your trusted source for the latest technology gadgets, electronics, and innovative accessories.';
      }

      // Remove any inappropriate tags or content
      if (updatedMetadata.tags) {
        // Filter out any inappropriate tags (though none seem inappropriate in current data)
        updatedMetadata.tags = updatedMetadata.tags.filter(tag =>
          !['inappropriate', 'offensive', 'explicit'].includes(tag.toLowerCase())
        );
      }

      // Update the vendor
      const { error: updateError } = await supabase
        .from('vendors')
        .update({
          description: updatedDescription,
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor.id);

      if (updateError) {
        console.error(`Error updating vendor ${vendor.name}:`, updateError);
      } else {
        console.log(`✓ Updated vendor: ${vendor.name} - ${updatedMetadata.category}`);
      }
    }

    // Now update products that may have inappropriate categorizations
    console.log('\nUpdating existing products for proper categorization...');

    // Get Caribbean vendor IDs first
    const { data: caribbeanVendors, error: caribbeanError } = await supabase
      .from('vendors')
      .select('id')
      .in('slug', ['island-threads', 'tropical-bliss', 'caribbean-crafts', 'island-fresh']);

    const caribbeanVendorIds = caribbeanVendors?.map(v => v.id) || [];

    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, title, slug, description, metadata, vendor_id')
      .not('vendor_id', 'in', `(${caribbeanVendorIds.join(',')})`);

    if (productError) {
      console.error('Error fetching products:', productError);
      return;
    }

    console.log(`Found ${products.length} existing products to review`);

    for (const product of products) {
      let updatedMetadata = { ...product.metadata };
      let needsUpdate = false;

      // Check if product has inappropriate categorization
      if (updatedMetadata.category) {
        // If category seems inappropriate or mismatched, update it based on product type
        if (product.title.toLowerCase().includes('headphones') ||
            product.title.toLowerCase().includes('speaker') ||
            product.title.toLowerCase().includes('fitness tracker') ||
            product.title.toLowerCase().includes('power bank') ||
            product.title.toLowerCase().includes('charging pad') ||
            product.title.toLowerCase().includes('smart home') ||
            product.title.toLowerCase().includes('gaming headset')) {
          if (updatedMetadata.category !== 'electronics') {
            updatedMetadata.category = 'electronics';
            needsUpdate = true;
          }
        } else if (product.title.toLowerCase().includes('coffee') ||
                   product.title.toLowerCase().includes('honey') ||
                   product.title.toLowerCase().includes('bread') ||
                   product.title.toLowerCase().includes('sauce') ||
                   product.title.toLowerCase().includes('greens') ||
                   product.title.toLowerCase().includes('cheese') ||
                   product.title.toLowerCase().includes('tea')) {
          if (updatedMetadata.category !== 'food' && updatedMetadata.category !== 'beverages') {
            // Determine if it's food or beverage
            if (product.title.toLowerCase().includes('tea') ||
                product.title.toLowerCase().includes('smoothie') ||
                product.title.toLowerCase().includes('cooler')) {
              updatedMetadata.category = 'beverages';
            } else {
              updatedMetadata.category = 'food';
            }
            needsUpdate = true;
          }
        } else if (product.title.toLowerCase().includes('t-shirt') ||
                   product.title.toLowerCase().includes('jeans') ||
                   product.title.toLowerCase().includes('sundress') ||
                   product.title.toLowerCase().includes('shirt') ||
                   product.title.toLowerCase().includes('headwrap')) {
          if (updatedMetadata.category !== 'fashion') {
            updatedMetadata.category = 'fashion';
            needsUpdate = true;
          }
        } else if (product.title.toLowerCase().includes('basket') ||
                   product.title.toLowerCase().includes('necklace') ||
                   product.title.toLowerCase().includes('bowl')) {
          if (updatedMetadata.category !== 'handmade') {
            updatedMetadata.category = 'handmade';
            needsUpdate = true;
          }
        } else if (product.title.toLowerCase().includes('mangoes') ||
                   product.title.toLowerCase().includes('plantains') ||
                   product.title.toLowerCase().includes('seasoning')) {
          if (updatedMetadata.category !== 'produce') {
            updatedMetadata.category = 'produce';
            needsUpdate = true;
          }
        }
      }

      // Remove inappropriate tags from products
      if (updatedMetadata.tags) {
        const originalLength = updatedMetadata.tags.length;
        updatedMetadata.tags = updatedMetadata.tags.filter(tag =>
          !['inappropriate', 'offensive', 'explicit'].includes(tag.toLowerCase())
        );
        if (updatedMetadata.tags.length < originalLength) {
          needsUpdate = true;
        }
      }

      // Update product if needed
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            metadata: updatedMetadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`Error updating product ${product.title}:`, updateError);
        } else {
          console.log(`✓ Updated product: ${product.title} - Category: ${updatedMetadata.category}`);
        }
      }
    }

    console.log('\n✓ Vendor and product categorizations updated successfully!');

  } catch (err) {
    console.error('Error updating categorizations:', err);
    process.exit(1);
  }
}

updateVendorCategorizations();