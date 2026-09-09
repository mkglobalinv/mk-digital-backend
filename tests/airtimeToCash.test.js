// Airtime-to-Cash test suite. Everything here runs against the mock provider
// (services/airtimeToCash/providers/mockProvider.js) and in-memory fake Mongoose
// models -- no real network call to AirtimeBridge is ever made, and no real money
// moves. This matches the explicit instruction: "Do NOT use real-money transactions
// during automated tests."
import { jest } from '@jest/globals';

// --- In-memory fake Mongoose model factory -----------------------------------
// Full Mongoose isn't exercised here (no live MongoDB in this environment) -- these
// fakes implement just enough of the Mongoose document/query API for
// AirtimeToCashService's logic to run exactly as it would against a real DB:
// create/findOne/find/save, with real object identity so mutations via `.save()`
// are visible on subsequent finds.
function makeFakeModel() {
    const store = [];
    let counter = 0;

    class FakeDoc {
        constructor(data) {
            // Emulate the handful of schema `default:` values AirtimeToCashService.js
            // relies on being present immediately after `.create()`, since this fake
            // has no real Mongoose schema to apply them.
            Object.assign(this, { walletCredited: false, retryCount: 0, status: 'PENDING' }, data);
            if (!this._id) this._id = `fake_${++counter}`;
        }
        async save() {
            const idx = store.findIndex((d) => d._id === this._id);
            if (idx === -1) store.push(this);
            else store[idx] = this;
            return this;
        }
        toObject() {
            return { ...this };
        }
    }

    function matches(doc, query) {
        return Object.entries(query).every(([k, v]) => {
            if (v && typeof v === 'object' && '$ne' in v) return doc[k] !== v.$ne;
            if (v && typeof v === 'object' && '$in' in v) return v.$in.includes(doc[k]);
            if (v && typeof v === 'object' && '$lt' in v) return (doc[k] || 0) < v.$lt;
            return doc[k] === v;
        });
    }

    const model = {
        _store: store,
        async create(data) {
            const doc = new FakeDoc(data);
            store.push(doc);
            return doc;
        },
        async findOne(query = {}) {
            return store.find((d) => matches(d, query)) || null;
        },
        find(query = {}) {
            const results = store.filter((d) => matches(d, query));
            const chain = {
                sort: () => chain,
                skip: () => chain,
                limit: () => chain,
                then: (resolve) => resolve(results)
            };
            return chain;
        }
    };
    return model;
}

const fakeAirtimeCashTransaction = makeFakeModel();
const fakeAirtimeCashAuditLog = makeFakeModel();
const fakeAirtimeCashPricing = makeFakeModel();
const fakeNotification = makeFakeModel();

let creditBalanceMock;

jest.unstable_mockModule('../models/AirtimeCashTransaction.js', () => ({ default: fakeAirtimeCashTransaction }));
jest.unstable_mockModule('../models/AirtimeCashAuditLog.js', () => ({ default: fakeAirtimeCashAuditLog }));
jest.unstable_mockModule('../models/AirtimeCashPricing.js', () => ({ default: fakeAirtimeCashPricing }));
jest.unstable_mockModule('../models/Notification.js', () => ({ default: fakeNotification }));
jest.unstable_mockModule('../services/walletService.js', () => ({
    creditBalance: (...args) => creditBalanceMock(...args)
}));
const { MockAirtimeToCashProvider } = await import('../services/airtimeToCash/providers/mockProvider.js');

jest.unstable_mockModule('../services/airtimeToCash/providers/index.js', () => ({
    getProvider: async () => ({
        provider: new MockAirtimeToCashProvider(),
        config: { isActive: true, isTestMode: true, networks: { MTN: true, AIRTEL: true, GLO: true, '9MOBILE': true } }
    })
}));
const { sanitizeAuditMetadata, maskPhone, maskAccountNumber, toSafeTransactionView } = await import('../services/airtimeToCash/security.js');

describe('MockAirtimeToCashProvider (pure provider logic, no network/DB)', () => {
    const provider = new MockAirtimeToCashProvider();

    test('requestOtp succeeds for a normal phone and returns a sessionId', async () => {
        const res = await provider.requestOtp({ network: 'MTN', phone: '08031234567', amount: 5000 });
        expect(res.success).toBe(true);
        expect(res.data.sessionId).toMatch(/^mock-sess-/);
    });

    test('requestOtp fails for a phone ending in 0000', async () => {
        const res = await provider.requestOtp({ network: 'MTN', phone: '08030000000', amount: 5000 });
        expect(res.success).toBe(false);
    });

    test('verifyOtp fails for otp "0000"', async () => {
        const res = await provider.verifyOtp({ sessionId: 'sess-1', otp: '0000' });
        expect(res.success).toBe(false);
    });

    test('verifyOtp succeeds for any other otp', async () => {
        const res = await provider.verifyOtp({ sessionId: 'sess-1', otp: '1234' });
        expect(res.success).toBe(true);
    });

    test('checkAvailability fails for a phone ending in 1111 (quota unavailable)', async () => {
        const res = await provider.checkAvailability({ phone: '08011111111', amount: 5000 });
        expect(res.success).toBe(false);
    });

    test('transfer fails outright for a phone ending in 2222', async () => {
        const res = await provider.transfer({ phone: '08022222222', amount: 5000 });
        expect(res.status).toBe('failed');
    });

    test('transfer returns ambiguous status for amount 999999', async () => {
        const res = await provider.transfer({ phone: '08031234567', amount: 999999 });
        expect(res.status).toBe('ambiguous');
        expect(res.success).toBe(false);
    });

    test('transfer succeeds for a normal request', async () => {
        const res = await provider.transfer({ phone: '08031234567', amount: 5000 });
        expect(res.status).toBe('success');
        expect(res.data.providerReference).toMatch(/^mock-txn-/);
    });
});

describe('security helpers', () => {
    test('sanitizeAuditMetadata redacts otp/pin keys at any depth', () => {
        const out = sanitizeAuditMetadata({ otp: '1234', nested: { transferPin: '9999', ok: 'fine' }, safe: 'value' });
        expect(out.otp).toBe('[REDACTED]');
        expect(out.nested.transferPin).toBe('[REDACTED]');
        expect(out.nested.ok).toBe('fine');
        expect(out.safe).toBe('value');
    });

    test('maskPhone masks the middle of a phone number', () => {
        expect(maskPhone('08031234567')).toBe('0803***4567');
    });

    test('maskAccountNumber masks the middle of an account number', () => {
        expect(maskAccountNumber('0123456789')).toBe('01******89');
    });

    test('toSafeTransactionView never includes providerSessionId even for admins', () => {
        const view = toSafeTransactionView({ toObject: () => ({ _id: 'x', senderPhone: '08031234567', accountNumber: '0123456789', providerSessionId: 'secret-session' }) }, { includeAdminFields: true });
        expect(view.providerSessionId).toBeUndefined();
    });
});

describe('AirtimeCashPricing calculation', () => {
    let pricing;

    beforeAll(async () => {
        pricing = await import('../services/airtimeToCash/pricing.js');
    });

    beforeEach(() => {
        fakeAirtimeCashPricing._store.length = 0;
    });

    test('uses the global rate when no tenant override exists', async () => {
        await fakeAirtimeCashPricing.create({ tenantId: null, network: 'MTN', conversionPercentage: 80, fixedFee: 0, minAmount: 500, maxAmount: 50000, isEnabled: true });
        const quote = await pricing.calculateAirtimeCashQuote({ tenantId: 'tenantA', network: 'MTN', amount: 10000 });
        expect(quote.source).toBe('global');
        expect(quote.payoutAmount).toBe(8000);
    });

    test('tenant override takes priority over the global rate', async () => {
        await fakeAirtimeCashPricing.create({ tenantId: null, network: 'MTN', conversionPercentage: 80, fixedFee: 0, minAmount: 500, maxAmount: 50000, isEnabled: true });
        await fakeAirtimeCashPricing.create({ tenantId: 'tenantA', network: 'MTN', conversionPercentage: 78, fixedFee: 100, minAmount: 500, maxAmount: 50000, isEnabled: true });
        const quote = await pricing.calculateAirtimeCashQuote({ tenantId: 'tenantA', network: 'MTN', amount: 10000 });
        expect(quote.source).toBe('tenant');
        expect(quote.payoutAmount).toBe(7700); // 10000*0.78 - 100
    });

    test('a different tenant without an override still gets the global rate', async () => {
        await fakeAirtimeCashPricing.create({ tenantId: null, network: 'MTN', conversionPercentage: 80, fixedFee: 0, minAmount: 500, maxAmount: 50000, isEnabled: true });
        await fakeAirtimeCashPricing.create({ tenantId: 'tenantA', network: 'MTN', conversionPercentage: 78, fixedFee: 0, minAmount: 500, maxAmount: 50000, isEnabled: true });
        const quote = await pricing.calculateAirtimeCashQuote({ tenantId: 'tenantB', network: 'MTN', amount: 10000 });
        expect(quote.source).toBe('global');
        expect(quote.payoutAmount).toBe(8000);
    });

    test('rejects an amount outside min/max', async () => {
        await fakeAirtimeCashPricing.create({ tenantId: null, network: 'MTN', conversionPercentage: 80, fixedFee: 0, minAmount: 1000, maxAmount: 5000, isEnabled: true });
        await expect(pricing.calculateAirtimeCashQuote({ tenantId: null, network: 'MTN', amount: 10000 })).rejects.toThrow(/between/);
    });

    test('throws PricingNotConfiguredError when no rate exists for the network at all', async () => {
        await expect(pricing.calculateAirtimeCashQuote({ tenantId: null, network: 'GLO', amount: 1000 })).rejects.toThrow(/not configured/);
    });
});

describe('AirtimeToCashService end-to-end state machine (mock provider, fake models)', () => {
    let Service;

    beforeAll(async () => {
        Service = await import('../services/airtimeToCash/AirtimeToCashService.js');
    });

    beforeEach(async () => {
        fakeAirtimeCashTransaction._store.length = 0;
        fakeAirtimeCashAuditLog._store.length = 0;
        fakeAirtimeCashPricing._store.length = 0;
        fakeNotification._store.length = 0;
        creditBalanceMock = jest.fn(async () => ({ balance1: 1000 })); // default: credit succeeds
        await fakeAirtimeCashPricing.create({ tenantId: null, network: 'MTN', conversionPercentage: 80, fixedFee: 0, minAmount: 500, maxAmount: 50000, isEnabled: true });
    });

    test('happy path: OTP -> verify -> availability -> transfer -> SUCCESS, wallet credited exactly once', async () => {
        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        expect(tx.status).toBe('OTP_REQUIRED');
        expect(tx.customerPayoutAmount).toBe(8000);

        tx = await Service.verifyOtp({ reference: tx.reference, customerId: 'cust1', otp: '1234' });
        expect(tx.status).toBe('OTP_VERIFIED');

        tx = await Service.checkAvailability({ reference: tx.reference, customerId: 'cust1' });
        expect(tx.status).toBe('READY_FOR_TRANSFER');

        tx = await Service.transfer({ reference: tx.reference, customerId: 'cust1', transferPin: '1111' });
        expect(tx.status).toBe('SUCCESS');
        expect(tx.walletCredited).toBe(true);
        expect(creditBalanceMock).toHaveBeenCalledTimes(1);
        expect(creditBalanceMock).toHaveBeenCalledWith('cust1', 8000, tx.walletCreditReference, expect.any(String));
    });

    test('duplicate idempotencyKey reattaches to the same transaction instead of creating a second one', async () => {
        const first = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789', idempotencyKey: 'dup-key-1' });
        const second = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789', idempotencyKey: 'dup-key-1' });
        expect(second.reference).toBe(first.reference);
        expect(fakeAirtimeCashTransaction._store.length).toBe(1);
    });

    test('invalid OTP keeps the transaction in OTP_REQUIRED and records a failure reason, never storing the OTP itself', async () => {
        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        tx = await Service.verifyOtp({ reference: tx.reference, customerId: 'cust1', otp: '0000' });
        expect(tx.status).toBe('OTP_REQUIRED');
        expect(tx.failureReason).toBeTruthy();
        // The wrong OTP value ("0000") itself must never be persisted anywhere on the
        // document -- check every field individually (a whole-object substring check
        // would false-positive on unrelated numeric fields like amounts).
        for (const [key, value] of Object.entries(tx.toObject ? tx.toObject() : tx)) {
            if (typeof value === 'string') expect(value).not.toBe('0000');
        }
    });

    test('quota unavailable fails the transaction without ever touching the wallet', async () => {
        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08011111111', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        tx = await Service.verifyOtp({ reference: tx.reference, customerId: 'cust1', otp: '1234' });
        tx = await Service.checkAvailability({ reference: tx.reference, customerId: 'cust1' });
        expect(tx.status).toBe('FAILED');
        expect(creditBalanceMock).not.toHaveBeenCalled();
    });

    test('transfer failure never credits the wallet', async () => {
        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08022222222', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        tx = await Service.verifyOtp({ reference: tx.reference, customerId: 'cust1', otp: '1234' });
        tx = await Service.checkAvailability({ reference: tx.reference, customerId: 'cust1' });
        tx = await Service.transfer({ reference: tx.reference, customerId: 'cust1', transferPin: '1111' });
        expect(tx.status).toBe('FAILED');
        expect(creditBalanceMock).not.toHaveBeenCalled();
    });

    test('ambiguous provider response goes to MANUAL_REVIEW without crediting or retrying automatically', async () => {
        await fakeAirtimeCashPricing.create({ tenantId: null, network: 'AIRTEL', conversionPercentage: 80, fixedFee: 0, minAmount: 500, maxAmount: 1000000, isEnabled: true });
        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'AIRTEL', phone: '08031234567', amount: 999999, bankName: 'GTBank', accountNumber: '0123456789' });
        tx = await Service.verifyOtp({ reference: tx.reference, customerId: 'cust1', otp: '1234' });
        tx = await Service.checkAvailability({ reference: tx.reference, customerId: 'cust1' });
        tx = await Service.transfer({ reference: tx.reference, customerId: 'cust1', transferPin: '1111' });
        expect(tx.status).toBe('MANUAL_REVIEW');
        expect(creditBalanceMock).not.toHaveBeenCalled();
    });

    test('a wallet-credit failure after provider confirmation leaves a recoverable state, and reconciliation retries exactly once to SUCCESS', async () => {
        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        tx = await Service.verifyOtp({ reference: tx.reference, customerId: 'cust1', otp: '1234' });
        tx = await Service.checkAvailability({ reference: tx.reference, customerId: 'cust1' });

        creditBalanceMock = jest.fn(async () => null); // simulate a transient wallet-credit failure
        tx = await Service.transfer({ reference: tx.reference, customerId: 'cust1', transferPin: '1111' });
        expect(tx.status).toBe('PROCESSING'); // recoverable: provider confirmed, credit not yet applied
        expect(tx.walletCredited).toBe(false);
        expect(tx.providerConfirmedAt).toBeTruthy();

        creditBalanceMock = jest.fn(async () => ({ balance1: 1000 })); // credit now succeeds
        await Service.runReconciliationPass();

        const resolved = await fakeAirtimeCashTransaction.findOne({ reference: tx.reference });
        expect(resolved.status).toBe('SUCCESS');
        expect(resolved.walletCredited).toBe(true);
        expect(creditBalanceMock).toHaveBeenCalledTimes(1);
        expect(creditBalanceMock).toHaveBeenCalledWith('cust1', 8000, resolved.walletCreditReference, expect.any(String));
    });

    test('cannot skip states: transfer is refused unless the transaction is READY_FOR_TRANSFER', async () => {
        const tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        await expect(Service.transfer({ reference: tx.reference, customerId: 'cust1', transferPin: '1111' })).rejects.toThrow(/Cannot transfer from status/);
    });

    test('tenant isolation: a customer cannot look up another customer\'s transaction by reference', async () => {
        const tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        await expect(Service.getOwnTransaction(tx.reference, 'cust2')).rejects.toThrow(/not found/i);
    });
});
