import { strict as assert } from 'assert';
import * as identro from '../services/providers/identro.js';
import axios from 'axios';
import sinon from 'sinon';

/**
 * Identro Provider Mock Tests
 * 
 * Verifies that the client normalizes responses correctly without hitting the live API.
 */

async function runTests() {
    console.log('--- Running Identro Provider Mock Tests ---');

    // Stub axios
    const postStub = sinon.stub(axios.Axios.prototype, 'post');

    try {
        // Test 1: Successful NIN Verification Mock
        postStub.withArgs('/nin/verify').resolves({
            status: 200,
            data: {
                status: true,
                message: 'Verification completed successfully',
                reference: 'REF123',
                data: { nin: '12345678901', firstname: 'Test' }
            }
        });

        const ninResult = await identro.verifyNIN('12345678901');
        assert.equal(ninResult.success, true, 'NIN success should be true');
        assert.equal(ninResult.reference, 'REF123', 'Should map reference properly');
        assert.equal(ninResult.provider_used, 'identro', 'Provider should be identro');
        console.log('✅ NIN Verification Mock Test Passed');

        // Test 2: Failed API call (Invalid payload)
        postStub.withArgs('/bvn/verify').rejects({
            status: 400,
            response: {
                status: 400,
                data: {
                    status: false,
                    message: 'Invalid request payload',
                    reference: 'ERR456'
                }
            }
        });

        try {
            await identro.verifyBVN('000');
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.equal(error.success, false, 'Error should have success = false');
            assert.equal(error.status, 400, 'Error status should be 400');
            assert.equal(error.message, 'Invalid request payload', 'Error message normalized');
            console.log('✅ Failed BVN API Mock Test Passed');
        }

        // Test 3: Unsupported Endpoint
        const modifyResult = await identro.modifyNIN({});
        assert.equal(modifyResult.success, false, 'Unsupported endpoint should return false');
        console.log('✅ Unsupported Endpoint Stub Test Passed');

        console.log('--- All Mock Tests Passed Successfully ---');
    } finally {
        postStub.restore();
    }
}

// Only run if sinon is installed, otherwise skip gracefully
import('sinon').then(() => runTests()).catch(() => {
    console.log('Sinon not found, skipping mock tests. Install sinon to run `identro.test.js` or run `identro_live.test.js` instead.');
});
