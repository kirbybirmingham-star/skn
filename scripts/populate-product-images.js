import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load env
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars. Aborting.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Enhanced category mapping for organized storage
const categoryMapping = {
  // Existing products - map to organized categories
  'premium-wireless-headphones': { category: 'electronics', filename: 'headphones.jpg' },
  'organic-coffee-beans': { category: 'food', filename: 'coffee.jpg' },
  'smart-fitness-tracker': { category: 'electronics', filename: 'fitness-tracker.jpg' },
  'portable-power-bank': { category: 'electronics', filename: 'power-bank.jpg' },
  'bluetooth-speaker': { category: 'electronics', filename: 'bluetooth-speaker.jpg' },
  'organic-honey': { category: 'food', filename: 'honey.jpg' },
  'artisan-bread-loaf': { category: 'food', filename: 'bread.webp' },
  'gourmet-pasta-sauce': { category: 'food', filename: 'pasta-sauce.jpg' },

  // New Caribbean products - organized by category
  // Fashion (12 items)
  'caribbean-print-maxi-dress': { category: 'fashion', filename: 'caribbean-print-maxi-dress.jpg' },
  'embroidered-beach-cover-up': { category: 'fashion', filename: 'embroidered-beach-cover-up.jpg' },
  'palm-leaf-print-hat': { category: 'fashion', filename: 'palm-leaf-print-hat.jpg' },
  'caribbean-sundress-yellow': { category: 'fashion', filename: 'caribbean-sundress-yellow.jpg' },
  'mens-linen-shirt-white': { category: 'fashion', filename: 'mens-linen-shirt-white.jpg' },
  'mens-linen-shirt-blue': { category: 'fashion', filename: 'mens-linen-shirt-blue.jpg' },
  'womens-wrap-skirt': { category: 'fashion', filename: 'womens-wrap-skirt.jpg' },
  'straw-hat-natural': { category: 'fashion', filename: 'straw-hat-natural.jpg' },
  'straw-hat-colored': { category: 'fashion', filename: 'straw-hat-colored.jpg' },
  'beach-sandals-brown': { category: 'fashion', filename: 'beach-sandals-brown.jpg' },
  'beach-sandals-colorful': { category: 'fashion', filename: 'beach-sandals-colorful.jpg' },
  'cotton-tshirt-local': { category: 'fashion', filename: 'cotton-tshirt-local.jpg' },
  'cotton-tshirt-tourist': { category: 'fashion', filename: 'cotton-tshirt-tourist.jpg' },
  'sarong-beach-wrap': { category: 'fashion', filename: 'sarong-beach-wrap.jpg' },

  // Electronics (6 items)
  'bluetooth-speaker-portable': { category: 'electronics', filename: 'bluetooth-speaker-portable.jpg' },
  'phone-case-caribbean': { category: 'electronics', filename: 'phone-case-caribbean.jpg' },
  'power-bank-solar': { category: 'electronics', filename: 'power-bank-solar.jpg' },
  'earbuds-wireless': { category: 'electronics', filename: 'earbuds-wireless.jpg' },
  'usb-cable-tropical': { category: 'electronics', filename: 'usb-cable-tropical.jpg' },
  'phone-stand-adjustable': { category: 'electronics', filename: 'phone-stand-adjustable.jpg' },

  // Produce (8 items)
  'soursop-passion-fruit-blend': { category: 'smoothies', filename: 'soursop-passion-fruit-blend.jpg' },
  'tamarind-ginger-tea': { category: 'smoothies', filename: 'tamarind-ginger-tea.jpg' },
  'guava-paradise-bowl': { category: 'smoothies', filename: 'guava-paradise-bowl.jpg' },
  'pineapple-whole': { category: 'produce', filename: 'pineapple-whole.jpg' },
  'woven-seagrass-placemats': { category: 'crafts', filename: 'woven-seagrass-placemats.jpg' },
  'caribbean-dreamcatcher': { category: 'crafts', filename: 'caribbean-dreamcatcher.jpg' },
  'recycled-glass-wind-chimes': { category: 'crafts', filename: 'recycled-glass-wind-chimes.jpg' },
  'fresh-starfruit-carambola': { category: 'produce', filename: 'fresh-starfruit-carambola.jpg' },
  'fresh-scotch-bonnet-peppers': { category: 'produce', filename: 'fresh-scotch-bonnet-peppers.jpg' },
  'dried-mango-slices': { category: 'produce', filename: 'dried-mango-slices.jpg' },

  // Additional Caribbean products from Phase 3 expansion
  'vibrant-caribbean-sundress': { category: 'fashion', filename: 'vibrant-caribbean-sundress.jpg' },
  'island-linen-shirt': { category: 'fashion', filename: 'island-linen-shirt.jpg' },
  'traditional-madras-headwrap': { category: 'fashion', filename: 'traditional-madras-headwrap.jpg' },
  'mango-passion-smoothie': { category: 'smoothies', filename: 'mango-passion-smoothie.jpg' },
  'pineapple-ginger-cooler': { category: 'smoothies', filename: 'pineapple-ginger-cooler.jpg' },
  'coconut-banana-bliss': { category: 'smoothies', filename: 'coconut-banana-bliss.jpg' },
  'handwoven-palm-basket': { category: 'crafts', filename: 'handwoven-palm-basket.jpg' },
  'caribbean-bead-necklace': { category: 'crafts', filename: 'caribbean-bead-necklace.jpg' },
  'traditional-calabash-bowl': { category: 'crafts', filename: 'traditional-calabash-bowl.jpg' },
  'fresh-caribbean-mangoes': { category: 'produce', filename: 'fresh-caribbean-mangoes.jpg' },
  'authentic-jerk-seasoning': { category: 'produce', filename: 'authentic-jerk-seasoning.jpg' },
  'fresh-plantains': { category: 'produce', filename: 'fresh-plantains.jpg' },
  'island-curry-powder-blend': { category: 'produce', filename: 'island-curry-powder-blend.jpg' },

  // Crafts (6 items)
  'woven-basket-natural': { category: 'crafts', filename: 'woven-basket-natural.jpg' },
  'woven-basket-colored': { category: 'crafts', filename: 'woven-basket-colored.jpg' },
  'ceramic-bowl-handmade': { category: 'crafts', filename: 'ceramic-bowl-handmade.jpg' },
  'wooden-carving-fish': { category: 'crafts', filename: 'wooden-carving-fish.jpg' },
  'beaded-necklace': { category: 'crafts', filename: 'beaded-necklace.jpg' },
  'straw-mat-floor': { category: 'crafts', filename: 'straw-mat-floor.jpg' },

  // Smoothies (4 items)
  'mango-smoothie-glass': { category: 'smoothies', filename: 'mango-smoothie-glass.jpg' },
  'pineapple-smoothie-bottle': { category: 'smoothies', filename: 'pineapple-smoothie-bottle.jpg' },
  'tropical-fruit-juice': { category: 'smoothies', filename: 'tropical-fruit-juice.jpg' },
  'coconut-water-bottle': { category: 'smoothies', filename: 'coconut-water-bottle.jpg' },
};

async function main() {
  console.log('Starting to populate product images from organized Supabase storage...\n');

  // Get all products from the base products table
  const { data: products, error } = await supabase
    .from('products')
    .select('id, slug, title, image_url, gallery_images');

  if (error) {
    console.error('Error fetching products:', error);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('No products found in database.');
    return;
  }

  console.log(`Found ${products.length} products. Checking for images to update...\n`);

  let updatedCount = 0;

  for (const product of products) {
    const productInfo = categoryMapping[product.slug];
    if (!productInfo) {
      console.log(`No mapping found for product: ${product.title} (${product.slug})`);
      continue;
    }

    // Build the organized Supabase storage URL
    const storageUrl = `${supabaseUrl}/storage/v1/object/public/skn-bridge-assets/products/${productInfo.category}/${productInfo.filename}`;

    // Check if we need to update image_url - prefer organized URLs but fallback to existing if they work
    const needsImageUrlUpdate = !product.image_url ||
                                 (product.image_url.includes('product-images/') && !product.image_url.includes('skn-bridge-assets'));

    // Check if we need to update gallery_images
    const needsGalleryUpdate = !product.gallery_images ||
                                 product.gallery_images.length === 0 ||
                                 product.gallery_images.some(img => img.includes('product-images/') && !img.includes('skn-bridge-assets'));

    if (!needsImageUrlUpdate && !needsGalleryUpdate) {
      console.log(`Product ${product.title} already has proper images`);
      continue;
    }

    // Prepare update data
    const updateData = {};

    if (needsImageUrlUpdate) {
      updateData.image_url = storageUrl;
    }

    if (needsGalleryUpdate) {
      updateData.gallery_images = [storageUrl];
    }

    // Update the base products table
    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', product.id);

    if (updateError) {
      console.error(`❌ Error updating ${product.title}:`, updateError);
    } else {
      console.log(`✓ Updated ${product.title} with organized storage URLs`);
      updatedCount++;
    }
  }

  console.log(`\nCompleted! Updated ${updatedCount} products with organized image URLs from Supabase storage.`);
  console.log('Image URLs now point to: /skn-bridge-assets/products/{category}/{filename}');
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});