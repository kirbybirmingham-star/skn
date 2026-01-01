import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function assignProductsToVendor(email) {
  try {
    // Find user profile by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error('User profile not found:', profileError);
      return;
    }

    // Find vendor by owner_id
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name')
      .eq('owner_id', profile.id)
      .single();

    if (vendorError || !vendor) {
      console.error('Vendor store not found:', vendorError);
      return;
    }

    console.log(`Found vendor: ${vendor.name} (${vendor.id})`);

    // Get all Caribbean products that are not already assigned to a vendor
    const { data: caribbeanProducts, error: productsError } = await supabase
      .from('products')
      .select('id, title')
      .ilike('title', '%caribbean%')
      .is('vendor_id', null);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }

    if (!caribbeanProducts || caribbeanProducts.length === 0) {
      console.log('No unassigned Caribbean products found');
      return;
    }

    console.log(`Found ${caribbeanProducts.length} unassigned Caribbean products`);

    // Assign products to the vendor
    const productIds = caribbeanProducts.map(p => p.id);
    const { error: updateError } = await supabase
      .from('products')
      .update({ vendor_id: vendor.id })
      .in('id', productIds);

    if (updateError) {
      console.error('Failed to assign products:', updateError);
      return;
    }

    console.log(`Successfully assigned ${caribbeanProducts.length} products to ${vendor.name}`);

    // Now create product variants for inventory management
    for (const product of caribbeanProducts) {
      const { error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: product.id,
          seller_id: profile.id,
          sku: `${product.title.replace(/\s+/g, '-').toUpperCase()}-001`,
          price_in_cents: 250000, // $250.00 default
          inventory_quantity: 50, // Default stock
          is_active: true,
          attributes: { 'size': 'Standard' }
        });

      if (variantError && !variantError.message.includes('duplicate key')) {
        console.error(`Failed to create variant for ${product.title}:`, variantError);
      } else {
        console.log(`Created inventory variant for: ${product.title}`);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

// Get command line arguments
const [,, email] = process.argv;

if (!email) {
  console.log('Usage: node assign-products-to-vendor.js <email>');
  console.log('Example: node assign-products-to-vendor.js user@example.com');
  process.exit(1);
}

assignProductsToVendor(email);