import NINBVNPortalProvider from '../services/providers/ninbvnportal.js';

/**
 * LIVE VERIFICATION SCRIPT FOR NINBVNPORTAL
 * DO NOT RUN IN CI/CD. Runs manually during evaluation phase.
 * 
 * Usage:
 * NINBVNPORTAL_API_KEY="your_key" TEST_NIN="1234" TEST_BVN="5678" node tests/ninbvnportal_live.test.js
 */

const API_KEY = process.env.NINBVNPORTAL_API_KEY;
const TEST_NIN = process.env.TEST_NIN || 'YOUR_TEST_NIN_HERE';
const TEST_BVN = process.env.TEST_BVN || 'YOUR_TEST_BVN_HERE';
const TEST_PHONE = process.env.TEST_PHONE || '08000000000';

async function runLiveTests() {
    console.log('================================================');
    console.log('   NINBVNPORTAL LIVE VERIFICATION SCRIPT        ');
    console.log('================================================');

    if (!API_KEY) {
        console.error('❌ ERROR: NINBVNPORTAL_API_KEY environment variable is missing.');
        console.error('Please run with: NINBVNPORTAL_API_KEY="key" node tests/ninbvnportal_live.test.js');
        process.exit(1);
    }

    const provider = new NINBVNPortalProvider(API_KEY);
    
    // We disable the maskPII logging interceptor in live tests so we can see the exact raw response body
    // The interceptor logs the full response data anyway, so we are good.

    console.log('\n--- 1. Checking Wallet Balance ---');
    await provider.checkBalance();

    if (TEST_NIN !== 'YOUR_TEST_NIN_HERE') {
        console.log('\n--- 2. Verifying NIN ---');
        await provider.verifyNIN(TEST_NIN);
    } else {
        console.log('\n--- 2. Skipping NIN Verification (No TEST_NIN provided) ---');
    }

    if (TEST_BVN !== 'YOUR_TEST_BVN_HERE') {
        console.log('\n--- 3. Verifying BVN ---');
        await provider.verifyBVN(TEST_BVN);
    } else {
        console.log('\n--- 3. Skipping BVN Verification (No TEST_BVN provided) ---');
    }

    if (TEST_PHONE !== '08000000000') {
        console.log('\n--- 4. Searching NIN by Phone ---');
        await provider.searchNINByPhone(TEST_PHONE);

        console.log('\n--- 5. Searching BVN by Phone ---');
        await provider.searchBVNByPhone(TEST_PHONE);
    } else {
        console.log('\n--- 4 & 5. Skipping Phone Searches (No TEST_PHONE provided) ---');
    }

    // Demography test requires complex payload
    console.log('\n--- 6. Skipping Demography Test (Requires specific payload format discovery) ---');

    console.log('\n================================================');
    console.log('   LIVE VERIFICATION COMPLETE                   ');
    console.log('================================================');
}

runLiveTests().catch(console.error);
