import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in repo root
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('\nInspecting current database state...\n');

  // Check auth users (if we have permission)
  try {
    console.log('=== Auth Users ===');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log('Could not list auth users:', authError.message);
    } else {
      console.log('Total auth users:', authData.users.length);
      authData.users.forEach(u => {
        console.log(`- ${u.email} (id: ${u.id})`);
      });
    }
  } catch (err) {
    console.log('Auth access error:', err.message);
  }

  // Check profiles
  console.log('\n=== Profiles ===');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');
  
  if (profilesError) {
    console.log('Error reading profiles:', profilesError.message);
  } else {
    console.log('Total profiles:', profiles.length);
    profiles.forEach(p => {
      console.log(`- ${p.email} (id: ${p.id}, role: ${p.role})`);
    });
  }

  // Check vendors
  console.log('\n=== Vendors ===');
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .select('*');
  
  if (vendorsError) {
    console.log('Error reading vendors:', vendorsError.message);
  } else {
    console.log('Total vendors:', vendors.length);
    vendors.forEach(v => {
      console.log(`- ${v.name} (id: ${v.id}, owner: ${v.owner_id})`);
    });
  }

  // Check products - try both tables
  console.log('\n=== Products (products table) ===');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*');

  if (productsError) {
    console.log('Error reading products:', productsError.message);
  } else {
    console.log('Total products:', products.length);
    products.forEach(p => {
      console.log(`- ${p.title} (id: ${p.id}, vendor: ${p.vendor_id})`);
    });
  }

  // Check vendor_products
  console.log('\n=== Products (vendor_products table) ===');
  const { data: vendorProducts, error: vendorProductsError } = await supabase
    .from('vendor_products')
    .select('*');

  if (vendorProductsError) {
    console.log('Error reading vendor_products:', vendorProductsError.message);
  } else {
    console.log('Total vendor_products:', vendorProducts.length);
    vendorProducts.forEach(p => {
      console.log(`- ${p.title} (id: ${p.id}, vendor: ${p.vendor_id})`);
    });
  }

  // Check categories
  console.log('\n=== Categories ===');
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*');
  
  if (categoriesError) {
    console.log('Error reading categories:', categoriesError.message);
  } else {
    console.log('Total categories:', categories.length);
    categories.forEach(c => {
      console.log(`- ${c.name} (id: ${c.id})`);
    });
  }
}

main().catch(console.error);