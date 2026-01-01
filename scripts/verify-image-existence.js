import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars. Aborting.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categoryMapping = {
  'premium-wireless-headphones': { category: 'electronics', filename: 'headphones.jpg' },
  'organic-coffee-beans': { category: 'food', filename: 'coffee.jpg' },
  'smart-fitness-tracker': { category: 'electronics', filename: 'fitness-tracker.jpg' },
  'portable-power-bank': { category: 'electronics', filename: 'power-bank.jpg' },
  'bluetooth-speaker': { category: 'electronics', filename: 'bluetooth-speaker.jpg' },
  'organic-honey': { category: 'food', filename: 'honey.jpg' },
  'artisan-bread-loaf': { category: 'food', filename: 'bread.webp' },
  'gourmet-pasta-sauce': { category: 'food', filename: 'pasta-sauce.jpg' },
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
  'bluetooth-speaker-portable': { category: 'electronics', filename: 'bluetooth-speaker-portable.jpg' },
  'phone-case-caribbean': { category: 'electronics', filename: 'phone-case-caribbean.jpg' },
  'power-bank-solar': { category: 'electronics', filename: 'power-bank-solar.jpg' },
  'earbuds-wireless': { category: 'electronics', filename: 'earbuds-wireless.jpg' },
  'usb-cable-tropical': { category: 'electronics', filename: 'usb-cable-tropical.jpg' },
  'phone-stand-adjustable': { category: 'electronics', filename: 'phone-stand-adjustable.jpg' },
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
  'woven-basket-natural': { category: 'crafts', filename: 'woven-basket-natural.jpg' },
  'woven-basket-colored': { category: 'crafts', filename: 'woven-basket-colored.jpg' },
  'ceramic-bowl-handmade': { category: 'crafts', filename: 'ceramic-bowl-handmade.jpg' },
  'wooden-carving-fish': { category: 'crafts', filename: 'wooden-carving-fish.jpg' },
  'beaded-necklace': { category: 'crafts', filename: 'beaded-necklace.jpg' },
  'straw-mat-floor': { category: 'crafts', filename: 'straw-mat-floor.jpg' },
  'mango-smoothie-glass': { category: 'smoothies', filename: 'mango-smoothie-glass.jpg' },
  'pineapple-smoothie-bottle': { category: 'smoothies', filename: 'pineapple-smoothie-bottle.jpg' },
  'tropical-fruit-juice': { category: 'smoothies', filename: 'tropical-fruit-juice.jpg' },
  'coconut-water-bottle': { category: 'smoothies', filename: 'coconut-water-bottle.jpg' },
};

async function verifyImageExistence() {
  console.log('Verifying image existence in Supabase storage...\n');

  const categories = ['fashion', 'electronics', 'produce', 'crafts', 'smoothies', 'food'];
  let totalChecked = 0;
  let existing = 0;
  let missing = 0;

  for (const category of categories) {
    console.log(`\nChecking ${category.toUpperCase()} category:`);

    // Get all products in this category
    const categoryProducts = Object.entries(categoryMapping)
      .filter(([_, info]) => info.category === category);

    for (const [slug, info] of categoryProducts) {
      const path = `products/${category}/${info.filename}`;
      totalChecked++;

      try {
        // Try to get the file metadata
        const { data, error } = await supabase.storage
          .from('skn-bridge-assets')
          .list(path.split('/').slice(0, -1).join('/'), {
            search: info.filename
          });

        if (error) {
          console.log(`❌ ${slug}: Error checking - ${error.message}`);
          missing++;
        } else if (data && data.length > 0) {
          console.log(`✅ ${slug}: Found`);
          existing++;
        } else {
          console.log(`❌ ${slug}: Not found`);
          missing++;
        }
      } catch (err) {
        console.log(`❌ ${slug}: Exception - ${err.message}`);
        missing++;
      }
    }
  }

  console.log(`\nSummary:`);
  console.log(`Total checked: ${totalChecked}`);
  console.log(`Existing: ${existing}`);
  console.log(`Missing: ${missing}`);
  console.log(`Success rate: ${((existing / totalChecked) * 100).toFixed(1)}%`);
}

verifyImageExistence().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});