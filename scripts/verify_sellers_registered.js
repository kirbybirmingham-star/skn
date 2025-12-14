#!/usr/bin/env node
/**
 * Test Script: Verify Sellers are Registered
 * 
 * This script checks that all vendors have their owners properly registered
 * with the 'vendor' role in the profiles table.
 * 
 * Usage: node scripts/verify_sellers_registered.js
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

async function verifySellersRegistered() {
  try {
    console.log('🔍 Verifying seller registration...\n');
    
    // Get all vendors
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, owner_id, name, onboarding_status, created_at')
      .not('owner_id', 'is', null)
      .order('created_at', { ascending: false });
    
    if (vendorError) {
      console.error('❌ Error fetching vendors:', vendorError);
      process.exit(1);
    }

    if (!vendors || vendors.length === 0) {
      console.log('📭 No vendors found in database');
      process.exit(0);
    }

    console.log(`📊 Found ${vendors.length} vendor(s)\n`);
    console.log('Checking vendor registrations:\n');

    let allRegistered = true;
    const results = [];

    for (const vendor of vendors) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, email')
        .eq('id', vendor.owner_id)
        .single();

      if (profileError) {
        console.log(`❌ ${vendor.name}`);
        console.log(`   Owner ID: ${vendor.owner_id}`);
        console.log(`   Status: No profile found for this owner`);
        console.log(`   Action: This user needs to create an account\n`);
        allRegistered = false;
        results.push({ vendor: vendor.name, registered: false, reason: 'no_profile' });
      } else if (profile?.role !== 'vendor') {
        console.log(`⚠️  ${vendor.name}`);
        console.log(`   Owner ID: ${vendor.owner_id}`);
        console.log(`   Email: ${profile?.email}`);
        console.log(`   Current Role: ${profile?.role || 'null'}`);
        console.log(`   Status: Not registered as vendor (run migration to fix)\n`);
        allRegistered = false;
        results.push({ vendor: vendor.name, registered: false, reason: 'wrong_role' });
      } else {
        console.log(`✅ ${vendor.name}`);
        console.log(`   Owner ID: ${vendor.owner_id}`);
        console.log(`   Email: ${profile?.email}`);
        console.log(`   Role: ${profile?.role}`);
        console.log(`   Status: Properly registered\n`);
        results.push({ vendor: vendor.name, registered: true });
      }
    }

    console.log('📋 Summary:');
    const registered = results.filter(r => r.registered).length;
    const notRegistered = results.filter(r => !r.registered).length;
    console.log(`   ✅ Registered: ${registered}`);
    console.log(`   ❌ Not Registered: ${notRegistered}`);
    console.log(`   📦 Total: ${vendors.length}`);

    if (allRegistered) {
      console.log('\n🎉 All sellers are properly registered!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some sellers are not properly registered.');
      console.log('💡 Run this command to fix:');
      console.log('   node scripts/register_existing_sellers.js');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

verifySellersRegistered().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
