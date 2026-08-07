import 'dotenv/config';
import * as identro from '../services/providers/identro.js';

/**
 * Identro Provider LIVE Tests
 * 
 * PENDING: DO NOT EXECUTE until production/sandbox credentials are provided by the admin.
 * 
 * To run manually:
 * 1. Add IDENTRO_API_KEY to your .env
 * 2. Run: node tests/identro_live.test.js
 */

async function runLiveTests() {
    console.log('--- Running Identro Provider LIVE Tests ---');

    if (!process.env.IDENTRO_API_KEY) {
        console.log('⚠️ SKIPPED: IDENTRO_API_KEY is missing from .env.');
        console.log('Please provide credentials before running this test suite.');
        return;
    }

    try {
        console.log('\n1. Testing NIN Verification...');
        const ninResult = await identro.verifyNIN('12345678901');
        console.log('Result:', JSON.stringify(ninResult, null, 2));

        console.log('\n2. Testing CAC Name Search Quote...');
        // Manually testing a quote endpoint mapped in the docs
        try {
            const res = await identro.searchCACName('Test Company');
            console.log('Result:', JSON.stringify(res, null, 2));
        } catch(e) {
            console.log('Expected Error Output (e.g. invalid payload/auth):', e.message);
        }

        console.log('\n3. Testing Digital Products List...');
        const products = await identro.getDigitalProducts();
        console.log('Result:', JSON.stringify(products, null, 2));

        console.log('\n--- LIVE TEST SUITE FINISHED ---');
    } catch (error) {
        console.error('LIVE TEST FAILED:', error);
    }
}

runLiveTests().catch(console.error);
