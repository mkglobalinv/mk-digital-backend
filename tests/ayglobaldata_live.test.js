import AYGlobalDataProvider from '../services/providers/ayglobaldata.js';

/**
 * LIVE VERIFICATION SCRIPT FOR AY GLOBAL DATA
 * DO NOT RUN IN CI/CD. Runs manually during evaluation phase.
 * 
 * Usage:
 * AYGLOBALDATA_API_KEY="your_key" node tests/ayglobaldata_live.test.js
 */

const API_KEY = process.env.AYGLOBALDATA_API_KEY;

// Minimal test variables
const TEST_PHONE = '08123456789';
const TEST_METER = '04183281001'; // Usually Ikeja Electric test meter
const TEST_IUC = '7012345678';
const TEST_NIN = '12345678901';
const TEST_REF = 'TEST_' + Date.now();

async function runLiveTests() {
    console.log('================================================');
    console.log('   AY GLOBAL DATA LIVE VERIFICATION SCRIPT      ');
    console.log('================================================');

    if (!API_KEY) {
        console.error('❌ ERROR: AYGLOBALDATA_API_KEY environment variable is missing.');
        console.error('Please run with: AYGLOBALDATA_API_KEY="key" node tests/ayglobaldata_live.test.js');
        process.exit(1);
    }

    const provider = new AYGlobalDataProvider(API_KEY);
    
    console.log('\n--- 1. Checking Wallet Balance & User Details ---');
    await provider.getUserDetails();

    console.log('\n--- 2. Identity Verification (NIN by Phone) ---');
    await provider.verifyIdentity('nin', 'phone', TEST_PHONE);

    console.log('\n--- 3. Identity Verification (BVN by Number) ---');
    await provider.verifyIdentity('bvn', 'bvn', '12345678901');

    console.log('\n--- 4. Verify Electricity (Ikeja Electric - 1) ---');
    await provider.verifyElectricity('1', TEST_METER, 'prepaid');

    console.log('\n--- 5. Pay Electricity (Minimal Amount: 50 NGN) ---');
    await provider.payElectricity('1', TEST_METER, 'prepaid', 50, TEST_REF + '_elec');

    console.log('\n--- 6. Verify Cable TV (GOTV - 1) ---');
    await provider.verifyCable('1', TEST_IUC);

    console.log('\n--- 7. Buy Airtime (Minimal Amount: 50 NGN) ---');
    await provider.buyAirtime('1', TEST_PHONE, 50, TEST_REF + '_air');

    console.log('\n--- 8. Buy Data (Dummy Plan ID to test validation) ---');
    await provider.buyData('1', TEST_PHONE, '99999', TEST_REF + '_data');

    console.log('\n--- 9. Generate Exam PIN (WAEC - 1) ---');
    await provider.generateExamPin('1', 1, TEST_REF + '_exam');

    console.log('\n--- 10. Send Bulk SMS ---');
    await provider.sendBulkSMS('AYGLOBAL', TEST_PHONE, 'Test verification SMS');

    console.log('\n================================================');
    console.log('   LIVE VERIFICATION COMPLETE                   ');
    console.log('================================================');
}

runLiveTests().catch(console.error);
