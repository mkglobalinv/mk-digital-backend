import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// No MongoDB or live server required: this exercises the PaymentPoint
// integration's pure logic (provider selection/fallback, HTTP request
// construction, response normalization, webhook signature verification)
// in isolation, using the same TEST_MODE axios mocking utility the rest of
// the suite relies on.
process.env.TEST_MODE = 'true';
process.env.PAYMENTPOINT_API_KEY = process.env.PAYMENTPOINT_API_KEY || 'test_api_key';
process.env.PAYMENTPOINT_SECRET_KEY = process.env.PAYMENTPOINT_SECRET_KEY || 'test_secret_key';
process.env.PAYMENTPOINT_BUSINESS_ID = process.env.PAYMENTPOINT_BUSINESS_ID || 'test_business_id';
process.env.PAYMENTPOINT_WEBHOOK_SECRET = process.env.PAYMENTPOINT_WEBHOOK_SECRET || 'test_paymentpoint_webhook_secret';

const { initializeTestMode } = await import('../utils/testModeAdapter.js');
const { createVirtualAccount: createPaymentPointVirtualAccount } = await import('../services/paymentpointService.js');
const { createVirtualAccountWithFallback } = await import('../services/accountService.js');
const { verifyPaymentPointSignature } = await import('../controllers/paymentpointController.js');

describe('PaymentPoint Integration (Unit, no DB required)', () => {
    before(() => {
        initializeTestMode();
    });

    describe('paymentpointService.createVirtualAccount', () => {
        test('returns a Flutterwave-shaped success response', async () => {
            const result = await createPaymentPointVirtualAccount({
                email: 'unit-test@9jasub.com',
                phone: '08011112222',
                firstname: 'Unit',
                lastname: 'Test'
            });

            assert.strictEqual(result.status, 'success');
            assert.ok(result.data.account_number, 'account_number should be present');
            assert.strictEqual(result.data.bank_name, 'Palmpay');
            assert.ok(result.data.order_ref, 'order_ref should be present');
        });

        test('returns an error shape (not a throw) when the provider call fails', async () => {
            // phone 08000000000 is testModeAdapter's dedicated PaymentPoint failure trigger
            const result = await createPaymentPointVirtualAccount({ email: 'x@9jasub.com', phone: '08000000000' });
            assert.strictEqual(result.status, 'error');
            assert.ok(result.message, 'error response should include a message');
        });
    });

    describe('accountService.createVirtualAccountWithFallback (PRIMARY -> FALLBACK)', () => {
        test('uses PaymentPoint when it succeeds', async () => {
            const result = await createVirtualAccountWithFallback({
                email: 'primary-path@9jasub.com',
                phone: '08033334444',
                firstname: 'Primary',
                lastname: 'Path'
            });
            assert.strictEqual(result.status, 'success');
            assert.strictEqual(result.data.bank_name, 'Palmpay', 'Expected the PaymentPoint mock to have issued the account');
        });

        test('falls back to Flutterwave when PaymentPoint fails', async () => {
            const result = await createVirtualAccountWithFallback({
                email: 'fallback-path@9jasub.com',
                phone: '08000000000', // magic number: simulates PaymentPoint failure in TEST_MODE
                firstname: 'Fallback',
                lastname: 'Path'
            });
            assert.strictEqual(result.status, 'success');
            assert.strictEqual(result.data.bank_name, 'Test Flutterwave Bank', 'Expected automatic fallback to the Flutterwave mock');
        });
    });

    describe('paymentpointController.verifyPaymentPointSignature', () => {
        const secret = process.env.PAYMENTPOINT_WEBHOOK_SECRET;
        const payload = JSON.stringify({ transaction_id: 'abc123', amount_paid: 5000 });

        test('accepts a correctly signed payload', () => {
            const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
            assert.strictEqual(verifyPaymentPointSignature(payload, signature), true);
        });

        test('rejects a tampered payload', () => {
            const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
            const tamperedPayload = JSON.stringify({ transaction_id: 'abc123', amount_paid: 999999 });
            assert.strictEqual(verifyPaymentPointSignature(tamperedPayload, signature), false);
        });

        test('rejects a signature produced with the wrong secret', () => {
            const wrongSignature = crypto.createHmac('sha256', 'not-the-real-secret').update(payload).digest('hex');
            assert.strictEqual(verifyPaymentPointSignature(payload, wrongSignature), false);
        });

        test('rejects a missing signature', () => {
            assert.strictEqual(verifyPaymentPointSignature(payload, undefined), false);
        });
    });
});
