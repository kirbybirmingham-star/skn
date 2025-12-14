#!/usr/bin/env node

/**
 * Add Test KYC and Onboarding Data for Seller 1
 * 
 * This script adds comprehensive test data for KYC and onboarding to the first seller.
 * It updates the vendor record with test onboarding data including:
 * - Onboarding status (started, kyc_in_progress, or approved)
 * - KYC provider information
 * - Test documents (ID, address proof, business license)
 * - Test appeals (if rejected)
 * 
 * Usage: node scripts/add_test_kyc_data.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestKycData() {
  try {
    console.log('📋 Adding Test KYC and Onboarding Data for Seller 1\n');

    // Step 1: Find the first vendor
    console.log('Step 1: Finding first vendor...');
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1);

    if (vendorError) {
      console.error('❌ Error fetching vendor:', vendorError);
      process.exit(1);
    }

    if (!vendors || vendors.length === 0) {
      console.error('❌ No vendors found. Please create a vendor first.');
      process.exit(1);
    }

    const vendor = vendors[0];
    console.log(`✓ Found vendor: ${vendor.name} (ID: ${vendor.id})\n`);

    // Step 2: Prepare test onboarding data
    console.log('Step 2: Preparing test onboarding data...');

    const testDocuments = [
      {
        id: `doc-${Date.now()}-1`,
        name: 'National ID',
        type: 'identity',
        url: 'https://example.com/documents/test-id.pdf',
        uploaded_at: new Date().toISOString(),
        status: 'verified'
      },
      {
        id: `doc-${Date.now()}-2`,
        name: 'Address Proof',
        type: 'address',
        url: 'https://example.com/documents/test-address.pdf',
        uploaded_at: new Date(Date.now() - 86400000).toISOString(),
        status: 'verified'
      },
      {
        id: `doc-${Date.now()}-3`,
        name: 'Business License',
        type: 'business',
        url: 'https://example.com/documents/test-license.pdf',
        uploaded_at: new Date(Date.now() - 172800000).toISOString(),
        status: 'verified'
      }
    ];

    const testAppeals = [
      {
        id: `appeal-${Date.now()}-1`,
        reason: 'Document verification pending',
        description: 'Your address proof is being verified by our team.',
        created_at: new Date(Date.now() - 259200000).toISOString(),
        status: 'open'
      }
    ];

    const onboardingData = {
      documents: testDocuments,
      appeals: testAppeals,
      kyc_started_at: new Date(Date.now() - 604800000).toISOString(),
      kyc_completed_at: new Date(Date.now() - 345600000).toISOString(),
      verification_level: 'basic'
    };

    console.log(`✓ Prepared ${testDocuments.length} test documents`);
    console.log(`✓ Prepared ${testAppeals.length} test appeals\n`);

    // Step 3: Update vendor with KYC data
    console.log('Step 3: Updating vendor with KYC and onboarding data...');

    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update({
        onboarding_status: 'approved',
        kyc_provider: 'test_provider',
        kyc_id: `test-kyc-${Date.now()}`,
        onboarding_data: onboardingData,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendor.id)
      .select();

    if (updateError) {
      console.error('❌ Error updating vendor:', updateError);
      process.exit(1);
    }

    console.log('✓ Successfully updated vendor with KYC data\n');

    // Step 4: Display results
    console.log('📊 Updated Vendor Information:');
    console.log(`   ID: ${updatedVendor[0].id}`);
    console.log(`   Name: ${updatedVendor[0].name}`);
    console.log(`   Status: ${updatedVendor[0].onboarding_status}`);
    console.log(`   KYC Provider: ${updatedVendor[0].kyc_provider}`);
    console.log(`   KYC ID: ${updatedVendor[0].kyc_id}`);
    console.log(`   Documents: ${updatedVendor[0].onboarding_data?.documents?.length || 0}`);
    console.log(`   Appeals: ${updatedVendor[0].onboarding_data?.appeals?.length || 0}\n`);

    console.log('✅ Test data successfully added!\n');
    console.log('📝 Documents added:');
    testDocuments.forEach(doc => {
      console.log(`   - ${doc.name} (${doc.type})`);
    });

    console.log('\n🔔 Appeals added:');
    testAppeals.forEach(appeal => {
      console.log(`   - ${appeal.reason}`);
    });

    console.log('\n✨ You can now visit the onboarding dashboard to see the test data.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

addTestKycData();
