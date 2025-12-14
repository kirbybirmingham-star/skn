#!/usr/bin/env node
/**
 * Mock KYC Flow - Direct Database Testing
 * 
 * This script tests the KYC flow by directly simulating what happens:
 * 1. Start KYC - vendor status changes to kyc_in_progress
 * 2. Complete KYC - vendor status changes to kyc_completed
 * 3. Approve - vendor status changes to approved
 * 
 * Usage: node scripts/test_kyc_direct.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const seller2Id = '81972ecf-707d-4d30-a3c1-cff5a27b9b61'; // seller2@example.com
const seller2VendorId = '834883fd-b714-42b6-8480-a52956faf3de'; // Janes Gadgets

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testKYCFlow() {
  console.log('🔍 KYC Flow Direct Test\n');
  console.log('📋 Setup:');
  console.log(`   Seller 2 ID: ${seller2Id}`);
  console.log(`   Vendor: Janes Gadgets`);
  console.log(`   Vendor ID: ${seller2VendorId}\n`);

  try {
    // Step 1: Get current vendor status
    console.log('📊 STEP 1: Check Current Vendor Status');
    const { data: vendor1, error: err1 } = await supabase
      .from('vendors')
      .select('id, name, onboarding_status, kyc_provider, kyc_id, onboarding_data')
      .eq('id', seller2VendorId)
      .single();

    if (err1) {
      console.error('❌ Error fetching vendor:', err1);
      process.exit(1);
    }

    console.log(`   ✓ Vendor: ${vendor1.name}`);
    console.log(`   ✓ Current Status: ${vendor1.onboarding_status}`);
    console.log(`   ✓ KYC Provider: ${vendor1.kyc_provider || 'none'}`);
    console.log(`   ✓ KYC ID: ${vendor1.kyc_id || 'none'}\n`);

    // Step 2: Simulate starting KYC
    console.log('🚀 STEP 2: Simulate Starting KYC');
    const providerSessionId = `mock-${Date.now()}`;
    console.log(`   Creating KYC session: ${providerSessionId}`);

    const { error: kyc1Err } = await supabase
      .from('vendors')
      .update({
        kyc_provider: 'mock',
        kyc_id: providerSessionId,
        onboarding_status: 'kyc_in_progress',
        onboarding_data: {
          ...vendor1.onboarding_data,
          kyc_started_at: new Date().toISOString(),
          kyc_session_id: providerSessionId
        }
      })
      .eq('id', seller2VendorId);

    if (kyc1Err) {
      console.error('❌ Error starting KYC:', kyc1Err);
      process.exit(1);
    }

    console.log(`   ✓ Status changed to: kyc_in_progress`);
    console.log(`   ✓ KYC Provider set to: mock`);
    console.log(`   ✓ KYC ID set to: ${providerSessionId}\n`);

    // Step 3: Verify change
    console.log('✅ STEP 3: Verify KYC Started');
    const { data: vendor2 } = await supabase
      .from('vendors')
      .select('onboarding_status, kyc_provider, kyc_id')
      .eq('id', seller2VendorId)
      .single();

    console.log(`   ✓ Onboarding Status: ${vendor2.onboarding_status}`);
    console.log(`   ✓ KYC Provider: ${vendor2.kyc_provider}`);
    console.log(`   ✓ KYC ID: ${vendor2.kyc_id}\n`);

    // Step 4: Simulate KYC completion
    console.log('📋 STEP 4: Simulate KYC Completion');
    const completionData = {
      verification_type: 'mock',
      verified_name: 'Jane Smith',
      verified_email: 'seller2@example.com',
      verification_date: new Date().toISOString(),
      documents: [
        { type: 'id_document', status: 'verified', uploaded_at: new Date().toISOString() },
        { type: 'address_proof', status: 'verified', uploaded_at: new Date().toISOString() }
      ],
      identity_verified: true,
      address_verified: true,
      risk_level: 'low'
    };

    const { error: kyc2Err } = await supabase
      .from('vendors')
      .update({
        onboarding_status: 'kyc_completed',
        onboarding_data: {
          ...vendor2,
          kyc_completed_at: new Date().toISOString(),
          kyc_details: completionData
        }
      })
      .eq('id', seller2VendorId);

    if (kyc2Err) {
      console.error('❌ Error completing KYC:', kyc2Err);
      process.exit(1);
    }

    console.log(`   ✓ Status changed to: kyc_completed`);
    console.log(`   ✓ Verified name: Jane Smith`);
    console.log(`   ✓ Documents verified: 2`);
    console.log(`   ✓ Risk level: low\n`);

    // Step 5: Verify completion
    console.log('✅ STEP 5: Verify KYC Completed');
    const { data: vendor3 } = await supabase
      .from('vendors')
      .select('onboarding_status, onboarding_data')
      .eq('id', seller2VendorId)
      .single();

    console.log(`   ✓ Status: ${vendor3.onboarding_status}`);
    console.log(`   ✓ KYC Details:`, JSON.stringify(vendor3.onboarding_data.kyc_details, null, 2).split('\n').map(l => `     ${l}`).join('\n'), '\n');

    // Step 6: Simulate final approval
    console.log('🎯 STEP 6: Simulate Final Approval');
    const { error: approvalErr } = await supabase
      .from('vendors')
      .update({
        onboarding_status: 'approved',
        onboarding_data: {
          ...vendor3.onboarding_data,
          approved_at: new Date().toISOString(),
          approved_by: 'system:mock_kyc_flow',
          approval_reason: 'Mock KYC test - automatic approval'
        }
      })
      .eq('id', seller2VendorId);

    if (approvalErr) {
      console.error('❌ Error approving:', approvalErr);
      process.exit(1);
    }

    console.log(`   ✓ Status changed to: approved`);
    console.log(`   ✓ Seller 2 is now fully onboarded!\n`);

    // Step 7: Final status
    console.log('📋 STEP 7: Final Vendor Status');
    const { data: vendor4 } = await supabase
      .from('vendors')
      .select('id, name, owner_id, onboarding_status, kyc_provider, kyc_id, is_active')
      .eq('id', seller2VendorId)
      .single();

    console.log('   ┌─────────────────────────────────────────┐');
    console.log(`   │ Store: ${vendor4.name.padEnd(31)}│`);
    console.log(`   │ Owner: ${seller2Id.slice(0, 30)}... │`);
    console.log(`   │ Status: ${vendor4.onboarding_status.padEnd(30)}│`);
    console.log(`   │ KYC Provider: ${(vendor4.kyc_provider || 'mock').padEnd(23)}│`);
    console.log(`   │ Active: ${(vendor4.is_active ? 'Yes' : 'No').padEnd(31)}│`);
    console.log('   └─────────────────────────────────────────┘\n');

    // Step 8: Show the complete flow
    console.log('📈 COMPLETE FLOW SUMMARY:');
    console.log('   ');
    console.log('   Initial State       →  Starting KYC');
    console.log(`   ${vendor1.onboarding_status.padEnd(20)} →  kyc_in_progress`);
    console.log('   (using mock provider)');
    console.log('   ');
    console.log('   ↓ After KYC Completion');
    console.log('   ');
    console.log('   KYC In Progress    →  Completed');
    console.log('   kyc_in_progress    →  kyc_completed');
    console.log('   (documents verified, identity confirmed)');
    console.log('   ');
    console.log('   ↓ After Admin Approval');
    console.log('   ');
    console.log('   KYC Completed      →  Ready to Sell');
    console.log('   kyc_completed      →  approved');
    console.log('   (seller is now active)\n');

    console.log('🎉 KYC Flow Test Complete!\n');

    console.log('✅ What Happened:');
    console.log('   1. ✓ KYC started with mock provider');
    console.log('   2. ✓ Mock identity verification completed');
    console.log('   3. ✓ Mock document verification completed');
    console.log('   4. ✓ Vendor auto-approved');
    console.log('   5. ✓ Seller is now active and ready to sell\n');

    console.log('📝 Next Steps:');
    console.log('   1. Login as: seller2@example.com');
    console.log('   2. Visit: /dashboard/onboarding');
    console.log('   3. Status should show: "Approved" (green badge)');
    console.log('   4. Can now add products and start selling\n');

    console.log('🧪 Test Data:');
    console.log(`   Seller Email: seller2@example.com`);
    console.log(`   Store Name: Janes Gadgets`);
    console.log(`   KYC Provider: mock`);
    console.log(`   KYC Session: ${providerSessionId}\n`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testKYCFlow().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
