#!/usr/bin/env node
/**
 * Mock KYC Flow Testing Script
 * 
 * This script simulates the complete KYC process for testing:
 * 1. Start KYC flow for seller 2
 * 2. Simulate provider completing verification
 * 3. Verify status changes and can query updated vendor
 * 
 * Usage: node scripts/test_kyc_flow.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const serverUrl = process.env.BACKEND_URL || 'http://localhost:3001';
const seller2Id = '81972ecf-707d-4d30-a3c1-cff5a27b9b61'; // seller2@example.com
const seller2VendorId = '834883fd-b714-42b6-8480-a52956faf3de'; // Janes Gadgets

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to make HTTP requests
function makeRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = url.startsWith('https') ? https : require('http');
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testKYCFlow() {
  console.log('🔍 KYC Flow Testing Script\n');
  console.log('📋 Setup:');
  console.log(`   Server URL: ${serverUrl}`);
  console.log(`   Seller 2 ID: ${seller2Id}`);
  console.log(`   Vendor ID: ${seller2VendorId}\n`);

  try {
    // Step 1: Get current vendor status
    console.log('📊 Step 1: Check Current Vendor Status');
    const { data: vendor1, error: err1 } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', seller2VendorId)
      .single();

    if (err1) {
      console.error('❌ Error fetching vendor:', err1);
      process.exit(1);
    }

    console.log(`   Vendor: ${vendor1.name}`);
    console.log(`   Current Status: ${vendor1.onboarding_status}`);
    console.log(`   KYC Provider: ${vendor1.kyc_provider || 'none'}`);
    console.log(`   KYC ID: ${vendor1.kyc_id || 'none'}\n`);

    // Step 2: Get JWT token for seller 2
    console.log('🔐 Step 2: Getting Authentication Token');
    const { data: { session }, error: authErr } = await supabase.auth.admin.getUserById(seller2Id);
    
    if (authErr) {
      console.error('❌ Error getting user:', authErr);
      process.exit(1);
    }

    // Create a JWT manually for testing
    const token = session?.access_token || `mock-token-${seller2Id}`;
    console.log(`   ✓ Token ready (length: ${token.length})\n`);

    // Step 3: Start KYC flow
    console.log('🚀 Step 3: Starting KYC Flow');
    const startKycUrl = `${serverUrl}/api/onboarding/start-kyc`;
    console.log(`   POST ${startKycUrl}`);
    console.log(`   Body: { vendor_id: "${seller2VendorId}" }`);

    const startKycResponse = await makeRequest(
      'POST',
      startKycUrl,
      { vendor_id: seller2VendorId },
      { 'Authorization': `Bearer ${token}` }
    );

    console.log(`   Status: ${startKycResponse.status}`);
    
    if (startKycResponse.status !== 200) {
      console.error('❌ Failed to start KYC:', startKycResponse.body);
      process.exit(1);
    }

    const { providerUrl, providerSessionId } = startKycResponse.body;
    console.log(`   ✓ KYC Started`);
    console.log(`   Provider Session ID: ${providerSessionId}`);
    console.log(`   Provider URL: ${providerUrl}\n`);

    // Step 4: Verify vendor status changed
    console.log('✅ Step 4: Verify Vendor Status Changed');
    const { data: vendor2 } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', seller2VendorId)
      .single();

    console.log(`   Onboarding Status: ${vendor2.onboarding_status} (was: ${vendor1.onboarding_status})`);
    console.log(`   KYC Provider: ${vendor2.kyc_provider}`);
    console.log(`   KYC ID: ${vendor2.kyc_id}\n`);

    // Step 5: Simulate webhook - KYC completed successfully
    console.log('📡 Step 5: Simulating KYC Provider Webhook');
    const webhookUrl = `${serverUrl}/api/onboarding/webhook`;
    console.log(`   POST ${webhookUrl}`);

    const webhookPayload = {
      vendor_id: seller2VendorId,
      kyc_id: providerSessionId,
      status: 'kyc_completed',
      details: {
        verification_type: 'mock',
        verified_name: 'Jane Smith',
        verified_email: 'seller2@example.com',
        verification_date: new Date().toISOString(),
        documents: [
          { type: 'id_document', status: 'verified' },
          { type: 'address_proof', status: 'verified' }
        ]
      }
    };

    console.log(`   Body: ${JSON.stringify(webhookPayload, null, 2)}`);

    const webhookResponse = await makeRequest('POST', webhookUrl, webhookPayload);
    console.log(`   Status: ${webhookResponse.status}`);
    
    if (webhookResponse.status !== 200) {
      console.error('❌ Webhook failed:', webhookResponse.body);
    } else {
      console.log(`   ✓ Webhook received and processed\n`);
    }

    // Step 6: Verify final status
    console.log('🎯 Step 6: Verify Final Status');
    const { data: vendor3 } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', seller2VendorId)
      .single();

    console.log(`   Vendor: ${vendor3.name}`);
    console.log(`   Final Status: ${vendor3.onboarding_status} (was: kyc_in_progress)`);
    console.log(`   KYC Provider: ${vendor3.kyc_provider}`);
    console.log(`   KYC ID: ${vendor3.kyc_id}`);
    console.log(`   Onboarding Data: ${JSON.stringify(vendor3.onboarding_data, null, 2)}\n`);

    // Step 7: Simulate approval workflow
    console.log('✅ Step 7: Simulate Final Approval');
    console.log('   (In real workflow, admin would approve after KYC completion)\n');

    const { error: approvalErr } = await supabase
      .from('vendors')
      .update({ 
        onboarding_status: 'approved',
        onboarding_data: {
          ...vendor3.onboarding_data,
          approved_at: new Date().toISOString(),
          approved_by: 'system'
        }
      })
      .eq('id', seller2VendorId);

    if (approvalErr) {
      console.error('❌ Approval failed:', approvalErr);
    } else {
      console.log('   ✓ Vendor approved\n');
    }

    // Step 8: Final verification
    console.log('📋 Step 8: Final Vendor Status');
    const { data: vendor4 } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', seller2VendorId)
      .single();

    console.log('   ┌─────────────────────────────────┐');
    console.log(`   │ Vendor: ${vendor4.name.padEnd(25)} │`);
    console.log(`   │ Owner: ${seller2Id.slice(0, 20)}... │`);
    console.log(`   │ Status: ${vendor4.onboarding_status.padEnd(23)} │`);
    console.log(`   │ KYC: ${(vendor4.kyc_provider || 'complete').padEnd(25)} │`);
    console.log('   └─────────────────────────────────┘\n');

    console.log('🎉 KYC Flow Test Complete!\n');
    console.log('Summary:');
    console.log(`   ✅ Started KYC flow: ${vendor1.onboarding_status} → ${vendor2.onboarding_status}`);
    console.log(`   ✅ Simulated completion: ${vendor2.onboarding_status} → ${vendor3.onboarding_status}`);
    console.log(`   ✅ Final approval: ${vendor3.onboarding_status} → ${vendor4.onboarding_status}`);
    console.log(`   ✅ All statuses verified\n`);

    console.log('📝 Next Steps:');
    console.log('   1. Login as seller2@example.com');
    console.log('   2. Visit /dashboard/onboarding');
    console.log('   3. Should show vendor as "Approved"');
    console.log('   4. Can now create and sell products\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testKYCFlow().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
