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

async function addCaribbeanProducts() {
  console.log('Adding products for Caribbean stores...');

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

    // Add categories first
    const categories = [
      { name: 'Caribbean Fashion', slug: 'caribbean-fashion', parent_slug: 'clothing' },
      { name: 'Tropical Beverages', slug: 'tropical-beverages' },
      { name: 'Handmade Crafts', slug: 'handmade-crafts', parent_slug: 'home-goods' },
      { name: 'Caribbean Produce', slug: 'caribbean-produce' },
      { name: 'Island Spices', slug: 'island-spices' }
    ];

    for (const cat of categories) {
      const parentId = cat.parent_slug ?
        (await supabase.from('categories').select('id').eq('slug', cat.parent_slug).single()).data?.id : null;

      await supabase
        .from('categories')
        .upsert({
          name: cat.name,
          slug: cat.slug,
          parent_id: parentId,
          metadata: { theme: 'caribbean' }
        });
    }

    // Island Threads Products
    const islandThreadsProducts = [
      {
        vendor_id: vendorMap['island-threads'],
        title: 'Vibrant Caribbean Sundress',
        slug: 'vibrant-caribbean-sundress',
        description: 'A stunning sundress featuring traditional Caribbean patterns and vibrant colors. Made from lightweight cotton with a comfortable fit, perfect for island living or vacations. Hand-printed designs inspired by Jamaican heritage.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'caribbean-fashion').single()).data?.id,
        base_price: 4500,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'fashion', tags: ['caribbean', 'sundress', 'traditional', 'vibrant', 'cotton', 'hand-printed'] }
      },
      {
        vendor_id: vendorMap['island-threads'],
        title: 'Island Linen Shirt',
        slug: 'island-linen-shirt',
        description: 'Breathable linen shirt perfect for tropical climates. Features intricate embroidery inspired by Caribbean folk art. Unisex design with a relaxed fit, ideal for casual island wear or formal occasions.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'caribbean-fashion').single()).data?.id,
        base_price: 3500,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'fashion', tags: ['caribbean', 'linen', 'shirt', 'embroidered', 'breathable', 'tropical'] }
      },
      {
        vendor_id: vendorMap['island-threads'],
        title: 'Traditional Madras Headwrap',
        slug: 'traditional-madras-headwrap',
        description: 'Authentic Caribbean headwrap made from madras fabric. Multiple tying styles available, perfect for sun protection and as a fashion statement. Hand-dyed using traditional techniques passed down through generations.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'caribbean-fashion').single()).data?.id,
        base_price: 2500,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'fashion', tags: ['caribbean', 'headwrap', 'madras', 'traditional', 'hand-dyed', 'sun-protection'] }
      }
    ];

    // Tropical Bliss Products
    const tropicalBlissProducts = [
      {
        vendor_id: vendorMap['tropical-bliss'],
        title: 'Mango Passion Smoothie',
        slug: 'mango-passion-smoothie',
        description: 'A refreshing blend of ripe Jamaican mangoes, passion fruit, and coconut water. Naturally sweet with no added sugars. Made fresh daily with ingredients sourced from local Caribbean farms.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'tropical-beverages').single()).data?.id,
        base_price: 650,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'beverages', tags: ['caribbean', 'smoothie', 'mango', 'passion-fruit', 'fresh', 'natural'] }
      },
      {
        vendor_id: vendorMap['tropical-bliss'],
        title: 'Pineapple Ginger Cooler',
        slug: 'pineapple-ginger-cooler',
        description: 'Tangy pineapple blended with fresh ginger and lime. A revitalizing drink that captures the essence of the Caribbean. Naturally energizing with anti-inflammatory properties from the ginger.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'tropical-beverages').single()).data?.id,
        base_price: 550,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'beverages', tags: ['caribbean', 'pineapple', 'ginger', 'cooler', 'revitalizing', 'anti-inflammatory'] }
      },
      {
        vendor_id: vendorMap['tropical-bliss'],
        title: 'Coconut Banana Bliss',
        slug: 'coconut-banana-bliss',
        description: 'Creamy blend of fresh coconut and Caribbean bananas. A tropical treat that\'s both delicious and nutritious. Made with young coconuts harvested at peak ripeness for maximum flavor.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'tropical-beverages').single()).data?.id,
        base_price: 600,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'beverages', tags: ['caribbean', 'coconut', 'banana', 'creamy', 'nutritious', 'tropical'] }
      }
    ];

    // Caribbean Crafts Products
    const caribbeanCraftsProducts = [
      {
        vendor_id: vendorMap['caribbean-crafts'],
        title: 'Handwoven Palm Basket',
        slug: 'handwoven-palm-basket',
        description: 'Beautifully crafted basket woven from local palm leaves using traditional Haitian techniques. Perfect for storage, decoration, or as a unique gift. Each piece is handmade and one-of-a-kind.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'handmade-crafts').single()).data?.id,
        base_price: 7500,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'handmade', tags: ['caribbean', 'basket', 'palm-leaves', 'handwoven', 'traditional', 'haitian'] }
      },
      {
        vendor_id: vendorMap['caribbean-crafts'],
        title: 'Caribbean Bead Necklace',
        slug: 'caribbean-bead-necklace',
        description: 'Colorful necklace featuring recycled glass beads made from Caribbean sea glass. Each bead is individually shaped and polished, representing the vibrant colors of island life. Adjustable length.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'handmade-crafts').single()).data?.id,
        base_price: 12500,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'handmade', tags: ['caribbean', 'necklace', 'beads', 'recycled-glass', 'sea-glass', 'colorful'] }
      },
      {
        vendor_id: vendorMap['caribbean-crafts'],
        title: 'Traditional Calabash Bowl',
        slug: 'traditional-calabash-bowl',
        description: 'Polished calabash bowl carved from natural gourds grown in the Caribbean. Used traditionally for serving food or as decoration. Each bowl is unique with natural variations in size and shape.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'handmade-crafts').single()).data?.id,
        base_price: 8500,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'handmade', tags: ['caribbean', 'calabash', 'bowl', 'polished', 'natural', 'traditional'] }
      }
    ];

    // IslandFresh Products
    const islandFreshProducts = [
      {
        vendor_id: vendorMap['island-fresh'],
        title: 'Fresh Caribbean Mangoes',
        slug: 'fresh-caribbean-mangoes',
        description: 'Juicy, sweet mangoes grown in the fertile soils of Barbados. Hand-picked at peak ripeness for maximum flavor. Perfect for eating fresh, making smoothies, or tropical salads. 3lb box.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'caribbean-produce').single()).data?.id,
        base_price: 1200,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'produce', tags: ['caribbean', 'mangoes', 'fresh', 'juicy', 'tropical', 'barbados'] }
      },
      {
        vendor_id: vendorMap['island-fresh'],
        title: 'Authentic Jerk Seasoning',
        slug: 'authentic-jerk-seasoning',
        description: 'Traditional Jamaican jerk seasoning blend made with allspice, scotch bonnet peppers, and authentic Caribbean spices. Perfect for chicken, pork, or vegetables. Made with natural ingredients, no preservatives.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'island-spices').single()).data?.id,
        base_price: 850,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'spices', tags: ['caribbean', 'jerk', 'seasoning', 'jamaican', 'authentic', 'natural'] }
      },
      {
        vendor_id: vendorMap['island-fresh'],
        title: 'Fresh Plantains',
        slug: 'fresh-plantains',
        description: 'Green plantains perfect for frying, boiling, or making tostones. Grown in Caribbean soil for authentic flavor. Each bunch contains 4-6 plantains, enough for multiple meals. Traditional staple food.',
        category_id: (await supabase.from('categories').select('id').eq('slug', 'caribbean-produce').single()).data?.id,
        base_price: 450,
        currency: 'USD',
        is_published: true,
        metadata: { category: 'produce', tags: ['caribbean', 'plantains', 'fresh', 'green', 'traditional', 'staple'] }
      }
    ];

    // Insert all products
    const allProducts = [
      ...islandThreadsProducts,
      ...tropicalBlissProducts,
      ...caribbeanCraftsProducts,
      ...islandFreshProducts
    ];

    for (const product of allProducts) {
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

      // Create product variants (simplified) - use a default seller_id from existing profiles
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'seller')
        .limit(1)
        .single();

      const variant = {
        product_id: productData.id,
        seller_id: sellerProfile?.id || product.vendor_id, // fallback to vendor_id if no seller found
        sku: `${product.slug}-001`,
        price_in_cents: product.base_price * 100,
        inventory_quantity: 25,
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

    console.log('\n✓ Caribbean products added successfully!');

  } catch (err) {
    console.error('Error adding Caribbean products:', err);
    process.exit(1);
  }
}

addCaribbeanProducts();