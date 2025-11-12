import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// load env
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Basic presence checks (do not print secrets)
if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL in .env. Please set your Supabase URL (project URL) before running.');
  process.exit(2);
}

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env. This script requires the Supabase service role key (not the anon key).');
  console.error('Get it from your Supabase project Settings -> API -> Service Role Key.');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Minimal copy of the seed values we want to validate against the DB.
const seedUsers = [
  'seller1@example.com',
  'seller2@example.com',
  'buyer1@example.com',
  'buyer2@example.com',
  'buyer3@example.com'
];

const vendorSlugs = ['johns-general-store', 'janes-gadgets'];

const productSlugs = ['laptop', 't-shirt', 'coffee-mug', 'smartphone', 'jeans'];

const variantSkus = [
  'LAP-8-256','LAP-16-512','TS-BLK-S','TS-BLK-M','TS-BLK-L',
  'MUG-WHT','MUG-BLK','PHN-128-BLK','PHN-256-BLK',
  'JNS-30-32-BLU','JNS-32-32-BLU','JNS-34-32-BLU'
];

async function runChecks() {
  console.log('Connecting to DB and checking for seed conflicts...');

  const results = {
    missingProfiles: [],
    duplicateProfiles: [],
    vendorsWithMissingOwner: [],
    existingVendorSlugs: [],
    existingProductSlugs: [],
    existingVariantSkus: [],
  };

  // 1) Profiles present for seed users
  let foundProfiles;
  try {
    const res = await supabase
      .from('profiles')
      .select('id,email')
      .in('email', seedUsers);
    if (res.error) throw res.error;
    foundProfiles = res.data;
  } catch (err) {
    // Provide more actionable guidance for common permission issues
    const msg = err?.message || String(err);
    console.error('Error querying profiles:', msg);
    if (msg.toLowerCase().includes('permission denied') || msg.toLowerCase().includes('permission denied for schema')) {
      console.error('\nThis usually means the client key you supplied does not have sufficient privileges (RLS or anon key).');
      console.error('Make sure `SUPABASE_SERVICE_ROLE_KEY` in your .env is the Service Role key from your Supabase project settings (not the anon/public key).');
      console.error('If you are running against a local or CI environment, ensure the key is available to the process and not blocked by your runner.');
    }
    process.exit(3);
  }

  const foundByEmail = new Map((foundProfiles || []).map(p => [p.email, p.id]));
  results.missingProfiles = seedUsers.filter(e => !foundByEmail.has(e));

  // Check duplicates (shouldn't happen if email is unique) by counting in DB
  const { data: maybeDuplicates, error: dupErr } = await supabase
    .from('profiles')
    .select('email', { count: 'exact', head: false })
    .in('email', seedUsers);

  if (dupErr) {
    // non-fatal, continue
  }

  // 2) Vendors referencing non-existing profiles
  const { data: allVendors, error: vendErr } = await supabase
    .from('vendors')
    .select('id,slug,owner_id');

  if (vendErr) {
    console.error('Error querying vendors:', vendErr.message || vendErr);
    process.exit(4);
  }

  const profileIdSet = new Set((foundProfiles || []).map(p => p.id));
  results.vendorsWithMissingOwner = (allVendors || []).filter(v => v.owner_id && !profileIdSet.has(v.owner_id));

  // 3) Existing vendor slugs that will conflict with seed
  const { data: vendorsBySlug } = await supabase
    .from('vendors')
    .select('id,slug,owner_id')
    .in('slug', vendorSlugs);

  results.existingVendorSlugs = vendorsBySlug || [];

  // 4) Existing product slugs (any product with those slugs may conflict)
  const { data: productsBySlug } = await supabase
    .from('products')
    .select('id,slug,vendor_id')
    .in('slug', productSlugs);

  results.existingProductSlugs = productsBySlug || [];

  // 5) Variant SKUs already existing
  const { data: variantsBySku } = await supabase
    .from('product_variants')
    .select('id,sku,product_id')
    .in('sku', variantSkus);

  results.existingVariantSkus = variantsBySku || [];

  // Print human-friendly report
  console.log('--- Seed conflict check report ---');

  if (results.missingProfiles.length) {
    console.warn('Missing profiles for these seed emails:');
    results.missingProfiles.forEach(e => console.warn('  -', e));
  } else {
    console.log('All seed user emails have matching profiles.');
  }

  if (results.vendorsWithMissingOwner.length) {
    console.warn('\nVendors that reference owner_ids not present in profiles (possible FK problems):');
    results.vendorsWithMissingOwner.forEach(v => console.warn(`  - slug=${v.slug} owner_id=${v.owner_id}`));
  } else {
    console.log('All existing vendors have owner profiles present.');
  }

  if ((results.existingVendorSlugs || []).length) {
    console.warn('\nVendor slugs that already exist in DB and may conflict with seed upserts:');
    (results.existingVendorSlugs || []).forEach(v => console.warn(`  - slug=${v.slug} id=${v.id} owner_id=${v.owner_id}`));
  } else {
    console.log('No existing vendor slugs conflict with seed.');
  }

  if ((results.existingProductSlugs || []).length) {
    console.warn('\nProduct slugs that already exist in DB and may conflict with seed upserts:');
    (results.existingProductSlugs || []).forEach(p => console.warn(`  - slug=${p.slug} id=${p.id} vendor_id=${p.vendor_id}`));
  } else {
    console.log('No existing product slugs conflict with seed.');
  }

  if ((results.existingVariantSkus || []).length) {
    console.warn('\nVariant SKUs that already exist in DB and may conflict with seed upserts:');
    (results.existingVariantSkus || []).forEach(s => console.warn(`  - sku=${s.sku} id=${s.id} product_id=${s.product_id}`));
  } else {
    console.log('No existing variant SKUs conflict with seed.');
  }

  // exit with non-zero if any problems
  const hasProblems = results.missingProfiles.length
    || results.vendorsWithMissingOwner.length
    || (results.existingVendorSlugs || []).length
    || (results.existingProductSlugs || []).length
    || (results.existingVariantSkus || []).length;

  if (hasProblems) {
    console.error('\nSeed conflict check found potential problems. Fix the issues or review the seed flow before running seed scripts.');
    process.exit(5);
  }

  console.log('\nNo obvious conflicts detected. You can proceed to run the seed script.');
  process.exit(0);
}

runChecks().catch(err => {
  console.error('Unexpected error while running checks:', err);
  process.exit(99);
});
