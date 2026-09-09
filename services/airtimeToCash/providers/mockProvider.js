import crypto from 'crypto';
import { AirtimeToCashProviderInterface, AIRTIME_CASH_STATUS } from '../providerInterface.js';

// Deterministic fake provider used for local development and automated tests, so the
// full Airtime-to-Cash state machine (OTP -> quota -> transfer -> reconcile) can be
// exercised end-to-end without ever touching AirtimeBridge or real money. Selected by
// providers/index.js whenever the resolved config is in test/sandbox mode.
//
// Behavior is driven by "magic" inputs so tests can hit every branch on demand:
//   - phone ending in "0000" -> OTP request itself fails
//   - otp === "0000" -> verifyOtp fails ("Invalid OTP")
//   - phone ending in "1111" -> checkAvailability reports quota unavailable
//   - amount === 999999 -> transfer succeeds but checkStatus later reports 'ambiguous'
//   - phone ending in "2222" -> transfer fails outright
//   - anything else -> succeeds at every step
export class MockAirtimeToCashProvider extends AirtimeToCashProviderInterface {
    async requestOtp({ network, phone, amount }) {
        if (String(phone).endsWith('0000')) {
            return { success: false, status: AIRTIME_CASH_STATUS.FAILED, message: 'Mock: unable to reach subscriber for OTP.' };
        }
        const sessionId = `mock-sess-${crypto.randomBytes(8).toString('hex')}`;
        return {
            success: true,
            status: AIRTIME_CASH_STATUS.SUCCESS,
            message: 'OTP sent.',
            data: { sessionId }
        };
    }

    async verifyOtp({ sessionId, otp }) {
        if (!sessionId) {
            return { success: false, status: AIRTIME_CASH_STATUS.FAILED, message: 'Mock: missing sessionId.' };
        }
        if (String(otp) === '0000') {
            return { success: false, status: AIRTIME_CASH_STATUS.FAILED, message: 'Mock: invalid OTP.' };
        }
        return {
            success: true,
            status: AIRTIME_CASH_STATUS.SUCCESS,
            message: 'OTP verified.',
            data: { sessionId, airtimeBalance: '₦5,000.00', tariff: 'Mock', type: 'Prepaid' }
        };
    }

    async checkAvailability({ phone, amount }) {
        if (String(phone).endsWith('1111')) {
            return { success: false, status: AIRTIME_CASH_STATUS.FAILED, message: 'Mock: quota unavailable for this recipient right now.' };
        }
        return { success: true, status: AIRTIME_CASH_STATUS.SUCCESS, message: 'Recipient available.' };
    }

    async transfer({ sessionId, phone, amount }) {
        if (String(phone).endsWith('2222')) {
            return { success: false, status: AIRTIME_CASH_STATUS.FAILED, message: 'Mock: transfer declined by recipient network.' };
        }
        const providerReference = `mock-txn-${crypto.randomBytes(8).toString('hex')}`;
        if (Number(amount) === 999999) {
            // Simulate a provider that accepted the request but whose immediate response
            // is inconclusive -- the caller must NOT treat this as success.
            return {
                success: false,
                status: AIRTIME_CASH_STATUS.AMBIGUOUS,
                message: 'Mock: provider response ambiguous, awaiting confirmation.',
                data: { providerReference }
            };
        }
        return {
            success: true,
            status: AIRTIME_CASH_STATUS.SUCCESS,
            message: 'Transfer confirmed.',
            data: { providerReference }
        };
    }

    async checkStatus({ providerReference }) {
        // In this mock, any ambiguous transfer resolves to success on the next
        // reconciliation pass, so tests can exercise the "confirmed late" path.
        return {
            success: true,
            status: AIRTIME_CASH_STATUS.SUCCESS,
            message: 'Mock: reconciliation confirms success.',
            data: { providerReference }
        };
    }
}

export default MockAirtimeToCashProvider;
