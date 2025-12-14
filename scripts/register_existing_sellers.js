#!/usr/bin/env node
/**
 * Migration Script: Register Existing Sellers
 * 
 * This script updates the profiles table to mark all users who own vendors
 * as having the 'vendor' role. This fixes the issue where sellers were created
 * in the vendors table but their profile role wasn't updated.
 * 
 * Usage: node scripts/register_existing_sellers.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not configured in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function registerExistingSellers() {
  try {
    console.log('🔍 Finding all vendors and their owners...');
    
    // Get all unique owner_ids from vendors table
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, owner_id, name, onboarding_status')
      .not('owner_id', 'is', null);
    
    if (vendorError) {
      console.error('❌ Error fetching vendors:', vendorError);
      process.exit(1);
    }

    if (!vendors || vendors.length === 0) {
      console.log('✅ No vendors found. Nothing to update.');
      process.exit(0);
    }

    console.log(`📊 Found ${vendors.length} vendors`);

    // Get unique owner IDs
    const ownerIds = [...new Set(vendors.map(v => v.owner_id))];
    console.log(`👥 Found ${ownerIds.length} unique vendors/owners`);

    // Update all profiles for these owners to have 'vendor' role
    let updated = 0;
    let skipped = 0;

    for (const ownerId of ownerIds) {
      // Get current profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', ownerId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn(`⚠️  Error fetching profile for ${ownerId}:`, profileError.message);
        skipped++;
        continue;
      }

      if (!profile) {
        console.warn(`⚠️  No profile found for owner ${ownerId} - skipping`);
        skipped++;
        continue;
      }

      // If role is already vendor, skip
      if (profile.role === 'vendor') {
        console.log(`✓ Owner ${ownerId} already has vendor role`);
        skipped++;
        continue;
      }

      // Update the profile role to vendor
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'vendor' })
        .eq('id', ownerId);

      if (updateError) {
        console.error(`❌ Error updating role for ${ownerId}:`, updateError.message);
        skipped++;
      } else {
        console.log(`✅ Updated ${ownerId} - role set to 'vendor'`);
        updated++;
      }
    }

    console.log('\n📋 Summary:');
    console.log(`   ✅ Updated: ${updated} profiles`);
    console.log(`   ⊘ Skipped: ${skipped} profiles`);
    console.log(`   📦 Total vendors: ${vendors.length}`);
    console.log('\n🎉 Migration complete!');

    if (updated > 0) {
      console.log('\n💡 Next steps:');
      console.log('   1. Sellers can now access /dashboard/vendor');
      console.log('   2. Existing sellers should log out and log back in');
      console.log('   3. Their role will be loaded from the database');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

registerExistingSellers().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
