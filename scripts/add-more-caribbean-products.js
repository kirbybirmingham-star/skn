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

async function addMoreCaribbeanProducts() {
  console.log('Adding additional Caribbean products to reach 20-25 total...');

  try {
    // Get vendor IDs
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, slug')
      .in('slug', ['island-threads', 'tropical-bliss', 'caribbean-crafts', 'island-fresh']);

    if (vendorError) {
      console.error('Error fetching vendors:', vendorError);
      return;
    }

    const vendorMap = {};
    vendors.forEach(v => vendorMap[v.slug] = v.id);

    // Additional products to reach 20-25 total
    const additionalProducts = [
      // Island Threads - More fashion items
      {
        vendor_id: vendorMap['island-threads'],
        title: 'Caribbean Print Maxi Dress',
        slug: 'caribbean-print-maxi-dress',
        description: 'Flowing maxi dress with authentic Caribbean patterns featuring hibiscus flowers and tropical birds. Made from breathable cotton blend, perfect for beach weddings or formal island events. Features adjustable straps and a comfortable empire waist.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'caribbean-fashion').single()).data?.id,
        base_price: 6500,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'fashion', tags: ['caribbean', 'maxi-dress', 'print', 'formal', 'tropical', 'hibiscus'] }
      },
      {
        vendor_id: vendorMap['island-threads'],
        title: 'Embroidered Beach Cover-Up',
        slug: 'embroidered-beach-cover-up',
        description: 'Lightweight cover-up with intricate hand embroidery depicting Caribbean coastal scenes. Perfect for poolside lounging or as a light layer over swimwear. Features bell sleeves and a relaxed fit with side slits for comfort.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'caribbean-fashion').single()).data?.id,
        base_price: 4200,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'fashion', tags: ['caribbean', 'cover-up', 'beach', 'embroidered', 'lightweight', 'swimwear'] }
      },
      {
        vendor_id: vendorMap['island-threads'],
        title: 'Palm Leaf Print Hat',
        slug: 'palm-leaf-print-hat',
        description: 'Wide-brimmed hat featuring palm leaf patterns inspired by Caribbean jungles. Made from natural fibers with UPF 50+ sun protection. Adjustable chin strap and inner sweatband for all-day comfort during island adventures.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'caribbean-fashion').single()).data?.id,
        base_price: 2800,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'fashion', tags: ['caribbean', 'hat', 'sun-protection', 'palm-leaf', 'wide-brim', 'adventure'] }
      },

      // Tropical Bliss - More beverages and smoothies
      {
        vendor_id: vendorMap['tropical-bliss'],
        title: 'Soursop Passion Fruit Blend',
        slug: 'soursop-passion-fruit-blend',
        description: 'Creamy blend of soursop (guanabana) and passion fruit, two Caribbean superfruits known for their unique flavors and health benefits. Naturally sweet with immune-boosting properties. A tropical treat that is both delicious and nutritious.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'tropical-beverages').single()).data?.id,
        base_price: 700,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'beverages', tags: ['caribbean', 'soursop', 'passion-fruit', 'superfruit', 'immune-boosting', 'creamy'] }
      },
      {
        vendor_id: vendorMap['tropical-bliss'],
        title: 'Tamarind Ginger Tea',
        slug: 'tamarind-ginger-tea',
        description: 'Refreshing iced tea made from tamarind pods and fresh ginger root. A traditional Caribbean drink that is naturally tangy and spicy. Perfect for cooling down on hot island days. Contains natural antioxidants and digestive benefits.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'tropical-beverages').single()).data?.id,
        base_price: 550,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'beverages', tags: ['caribbean', 'tamarind', 'ginger', 'tea', 'traditional', 'digestive'] }
      },
      {
        vendor_id: vendorMap['tropical-bliss'],
        title: 'Guava Paradise Bowl',
        slug: 'guava-paradise-bowl',
        description: 'Thick and creamy smoothie bowl made with pink guava, banana, and coconut yogurt. Topped with fresh Caribbean fruits, nuts, and edible flowers. A nutritious breakfast or healthy dessert that captures the essence of tropical paradise.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'tropical-beverages').single()).data?.id,
        base_price: 850,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'beverages', tags: ['caribbean', 'guava', 'smoothie-bowl', 'paradise', 'nutritious', 'breakfast'] }
      },

      // Caribbean Crafts - More handmade items
      {
        vendor_id: vendorMap['caribbean-crafts'],
        title: 'Woven Seagrass Placemats',
        slug: 'woven-seagrass-placemats',
        description: 'Set of 4 placemats woven from natural seagrass using traditional Dominican techniques. Each placemat measures 18x12 inches and features subtle pattern variations. Perfect for dining tables, adds authentic Caribbean charm to your home decor.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'handmade-crafts').single()).data?.id,
        base_price: 6800,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'handmade', tags: ['caribbean', 'placemats', 'seagrass', 'woven', 'dining', 'traditional'] }
      },
      {
        vendor_id: vendorMap['caribbean-crafts'],
        title: 'Caribbean Dreamcatcher',
        slug: 'caribbean-dreamcatcher',
        description: 'Handcrafted dreamcatcher featuring Caribbean symbols and natural feathers. Made with willow branches, leather cords, and adorned with shells and beads collected from Caribbean beaches. A unique piece of island art and cultural heritage.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'handmade-crafts').single()).data?.id,
        base_price: 9500,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'handmade', tags: ['caribbean', 'dreamcatcher', 'art', 'cultural', 'shells', 'feathers'] }
      },
      {
        vendor_id: vendorMap['caribbean-crafts'],
        title: 'Recycled Glass Wind Chimes',
        slug: 'recycled-glass-wind-chimes',
        description: 'Melodic wind chimes made from recycled Caribbean sea glass in various shades of blue and green. Each piece is individually shaped and hung on sturdy nylon cords. Creates soothing island sounds when the trade winds blow. Perfect for patios and gardens.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'handmade-crafts').single()).data?.id,
        base_price: 4500,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'handmade', tags: ['caribbean', 'wind-chimes', 'recycled-glass', 'sea-glass', 'melodic', 'garden'] }
      },

      // Island Fresh - More produce and spices
      {
        vendor_id: vendorMap['island-fresh'],
        title: 'Fresh Starfruit (Carambola)',
        slug: 'fresh-starfruit-carambola',
        description: 'Exotic starfruit grown in Jamaican highlands. When sliced crosswise, each piece forms a perfect star shape. Sweet and tangy flavor with a crisp texture. Rich in vitamin C and dietary fiber. Perfect for fresh eating or adding to fruit salads.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'caribbean-produce').single()).data?.id,
        base_price: 350,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'produce', tags: ['caribbean', 'starfruit', 'exotic', 'vitamin-c', 'fresh', 'jamaican'] }
      },
      {
        vendor_id: vendorMap['island-fresh'],
        title: 'Island Curry Powder Blend',
        slug: 'island-curry-powder-blend',
        description: 'Authentic Caribbean curry powder made from a blend of turmeric, coriander, cumin, and Caribbean allspice. Medium heat level perfect for traditional island dishes. Made with natural ingredients, no artificial colors or preservatives. 8oz jar.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'island-spices').single()).data?.id,
        base_price: 920,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'spices', tags: ['caribbean', 'curry', 'powder', 'authentic', 'natural', 'traditional'] }
      },
      {
        vendor_id: vendorMap['island-fresh'],
        title: 'Fresh Scotch Bonnet Peppers',
        slug: 'fresh-scotch-bonnet-peppers',
        description: 'Famous Caribbean scotch bonnet peppers, essential for authentic jerk marinades and hot sauces. These small, colorful peppers pack significant heat with fruity undertones. Grown in volcanic soil for maximum flavor. Perfect for Caribbean cuisine lovers. Handle with care!',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'caribbean-produce').single()).data?.id,
        base_price: 480,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'produce', tags: ['caribbean', 'peppers', 'scotch-bonnet', 'spicy', 'jerk', 'authentic'] }
      },
      {
        vendor_id: vendorMap['island-fresh'],
        title: 'Dried Mango Slices',
        slug: 'dried-mango-slices',
        description: 'Sweet dried mango slices made from ripe Caribbean mangoes. Naturally sweet without added sugars, perfect for healthy snacking or adding to trail mixes. Rich in vitamins and minerals, these slices maintain the tropical flavor of fresh mangoes. 6oz bag.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'caribbean-produce').single()).data?.id,
        base_price: 620,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'produce', tags: ['caribbean', 'mango', 'dried', 'snack', 'natural', 'healthy'] }
      }
    ];

    // Insert all additional products
    for (const product of additionalProducts) {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (productError) {
        console.error(`Error creating product ${product.title}:`, productError);
        continue;
      }

      console.log(`✓ Created product: ${product.title}`);

      // Create product variants
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'seller')
        .limit(1)
        .single();

      const variant = {
        product_id: productData.id,
        seller_id: sellerProfile?.id || product.vendor_id,
        sku: `${product.slug}-001`,
        price_in_cents: product.base_price * 100,
        inventory_quantity: Math.floor(Math.random() * 20) + 10, // 10-30 random inventory
        is_active: true,
        attributes: { 'default': 'standard' }
      };

      const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variant);

      if (variantError) {
        console.error(`Error creating variant for ${product.title}:`, variantError);
      } else {
        console.log(`✓ Created variant for: ${product.title}`);
      }
    }

    console.log('\n✓ Additional Caribbean products added successfully!');

  } catch (err) {
    console.error('Error adding additional Caribbean products:', err);
    process.exit(1);
  }
}

addMoreCaribbeanProducts();