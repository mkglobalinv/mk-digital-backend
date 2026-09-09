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
            const now = new Date();
            Object.assign(
                this,
                { walletCredited: false, retryCount: 0, status: 'PENDING', creditClaimedAt: null, lastReconcileAttemptAt: null, createdAt: now, updatedAt: now },
                data
            );
            if (!this._id) this._id = `fake_${++counter}`;
        }
        async save() {
            this.updatedAt = new Date();
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
        if (query.$or) {
            if (!query.$or.some((clause) => matches(doc, clause))) return false;
        }
        return Object.entries(query).every(([k, v]) => {
            if (k === '$or') return true; // handled above
            if (v && typeof v === 'object' && '$ne' in v) return doc[k] !== v.$ne;
            if (v && typeof v === 'object' && '$in' in v) return v.$in.includes(doc[k]);
            if (v && typeof v === 'object' && '$lt' in v) {
                if (doc[k] === null || doc[k] === undefined) return true; // Mongo: missing/null < any date
                return doc[k] < v.$lt;
            }
            return doc[k] === v;
        });
    }

    function applyUpdate(doc, update) {
        if (update.$set) Object.assign(doc, update.$set);
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
        async findById(id) {
            return store.find((d) => d._id === id) || null;
        },
        // Synchronous body (no internal await before the mutation) is deliberate: it
        // makes this behave like MongoDB's real single-document atomicity guarantee
        // under concurrent callers -- two "simultaneous" calls (e.g. via Promise.all)
        // still each run their full read-check-write to completion before the other
        // gets a turn, so only one can ever match a filter the other has just
        // invalidated. This is what lets the concurrency test in this file exercise
        // the real race condition the atomic credit-claim guard is meant to close.
        async findOneAndUpdate(query, update, options = {}) {
            const doc = store.find((d) => matches(d, query));
            if (!doc) return null;
            applyUpdate(doc, update);
            doc.updatedAt = new Date();
            return doc;
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
// When set, replaces the mock provider entirely for the next getProvider() call --
// used to test provider-exception handling (Fix 3) without touching the real
// (still-stubbed) AirtimeBridgeProvider. A partial object is fine; only the
// method(s) a given test needs to throw must be provided.
let providerOverride = null;

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
        provider: providerOverride || new MockAirtimeToCashProvider(),
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

    test('a tenant-specific row explicitly disabled blocks the service for that tenant -- it does NOT fall back to the global rate', async () => {
        await fakeAirtimeCashPricing.create({ tenantId: null, network: 'MTN', conversionPercentage: 80, fixedFee: 0, minAmount: 500, maxAmount: 50000, isEnabled: true });
        await fakeAirtimeCashPricing.create({ tenantId: 'tenantBlocked', network: 'MTN', conversionPercentage: 78, fixedFee: 0, minAmount: 500, maxAmount: 50000, isEnabled: false });

        await expect(pricing.calculateAirtimeCashQuote({ tenantId: 'tenantBlocked', network: 'MTN', amount: 10000 })).rejects.toThrow(/not configured/);

        // A different tenant with no row of its own is unaffected and still gets global.
        const quote = await pricing.calculateAirtimeCashQuote({ tenantId: 'tenantOther', network: 'MTN', amount: 10000 });
        expect(quote.source).toBe('global');
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
        providerOverride = null;
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

    test('cross-tenant isolation: listTenantTransactions for tenant A never returns tenant B\'s transactions', async () => {
        await Service.requestOtp({ customerId: 'custA', tenantId: 'tenantA', network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        await Service.requestOtp({ customerId: 'custB', tenantId: 'tenantB', network: 'MTN', phone: '08039876543', amount: 5000, bankName: 'Zenith', accountNumber: '9876543210' });

        const tenantARows = await Service.listTenantTransactions('tenantA');
        const tenantBRows = await Service.listTenantTransactions('tenantB');

        expect(tenantARows).toHaveLength(1);
        expect(tenantARows[0].customerId).toBe('custA');
        expect(tenantBRows).toHaveLength(1);
        expect(tenantBRows[0].customerId).toBe('custB');
    });

    // --- Fix 3: provider exceptions -------------------------------------------

    test('exception thrown during requestOtp: transaction ends FAILED with a safe audit event, no OTP/PIN/token ever recorded', async () => {
        providerOverride = { requestOtp: async () => { throw new Error('ECONNRESET: socket hang up'); } };
        const tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });

        expect(tx.status).toBe('FAILED');
        expect(tx.failureReason).toBeTruthy();

        const audit = fakeAirtimeCashAuditLog._store.filter((a) => a.transactionId === tx._id);
        expect(audit.some((a) => a.action === 'OTP_REQUEST_ERROR')).toBe(true);
        const serialized = JSON.stringify(audit);
        expect(serialized).not.toMatch(/apiToken|Bearer /);
    });

    test('exception thrown during verifyOtp: transaction stays OTP_REQUIRED (retryable), not silently lost', async () => {
        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        expect(tx.status).toBe('OTP_REQUIRED');

        providerOverride = { verifyOtp: async () => { throw new Error('timeout of 30000ms exceeded'); } };
        tx = await Service.verifyOtp({ reference: tx.reference, customerId: 'cust1', otp: '1234' });

        expect(tx.status).toBe('OTP_REQUIRED'); // still retryable, not FAILED and not silently stuck
        expect(tx.retryCount).toBe(1);
        const audit = fakeAirtimeCashAuditLog._store.filter((a) => a.transactionId === tx._id);
        expect(audit.some((a) => a.action === 'OTP_VERIFY_ERROR')).toBe(true);
    });

    test('exception thrown during checkAvailability: transaction ends FAILED, wallet never touched', async () => {
        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        tx = await Service.verifyOtp({ reference: tx.reference, customerId: 'cust1', otp: '1234' });
        expect(tx.status).toBe('OTP_VERIFIED');

        providerOverride = { checkAvailability: async () => { throw new Error('502 Bad Gateway'); } };
        tx = await Service.checkAvailability({ reference: tx.reference, customerId: 'cust1' });

        expect(tx.status).toBe('FAILED');
        expect(creditBalanceMock).not.toHaveBeenCalled();
        const audit = fakeAirtimeCashAuditLog._store.filter((a) => a.transactionId === tx._id);
        expect(audit.some((a) => a.action === 'QUOTA_CHECK_ERROR')).toBe(true);
    });

    test('exception thrown during transfer: outcome unknown -> MANUAL_REVIEW, never FAILED, never auto-retried, wallet never credited', async () => {
        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        tx = await Service.verifyOtp({ reference: tx.reference, customerId: 'cust1', otp: '1234' });
        tx = await Service.checkAvailability({ reference: tx.reference, customerId: 'cust1' });
        expect(tx.status).toBe('READY_FOR_TRANSFER');

        let transferCallCount = 0;
        providerOverride = {
            transfer: async () => { transferCallCount += 1; throw new Error('ETIMEDOUT'); }
        };
        tx = await Service.transfer({ reference: tx.reference, customerId: 'cust1', transferPin: '1111' });

        expect(tx.status).toBe('MANUAL_REVIEW'); // outcome unknown -- never guessed as FAILED
        expect(transferCallCount).toBe(1); // never auto-repeated
        expect(creditBalanceMock).not.toHaveBeenCalled(); // never credited off an unknown outcome
        const audit = fakeAirtimeCashAuditLog._store.filter((a) => a.transactionId === tx._id);
        expect(audit.some((a) => a.action === 'PROVIDER_TRANSFER_ERROR')).toBe(true);
        expect(JSON.stringify(audit)).not.toMatch(/1111/); // transferPin never recorded
    });

    // --- Fix 4: reconciliation of orphan states --------------------------------

    test('stale PENDING (older than the threshold) is reconciled to FAILED', async () => {
        const tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        // Force it back to PENDING with an old createdAt, simulating a process crash
        // between transaction creation and the (now try/caught) OTP-request call
        // ever completing.
        tx.status = 'PENDING';
        tx.createdAt = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
        await tx.save();

        await Service.runReconciliationPass();

        const resolved = await fakeAirtimeCashTransaction.findOne({ reference: tx.reference });
        expect(resolved.status).toBe('FAILED');
    });

    test('a fresh (non-stale) PENDING transaction is left untouched by reconciliation', async () => {
        const tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        tx.status = 'PENDING'; // still fresh -- createdAt is "now"
        await tx.save();

        await Service.runReconciliationPass();

        const resolved = await fakeAirtimeCashTransaction.findOne({ reference: tx.reference });
        expect(resolved.status).toBe('PENDING'); // untouched -- never blindly retried/failed
    });

    test('stale QUOTA_CHECKING (older than the threshold) is reconciled to MANUAL_REVIEW, not guessed as FAILED', async () => {
        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        tx.status = 'QUOTA_CHECKING';
        await tx.save();
        // Backdate updatedAt directly on the stored document *after* save(), since
        // the fake model's save() -- correctly emulating Mongoose's own
        // {timestamps:true} behavior -- always stamps updatedAt to "now" itself.
        tx.updatedAt = new Date(Date.now() - 10 * 60 * 1000);

        await Service.runReconciliationPass();

        const resolved = await fakeAirtimeCashTransaction.findOne({ reference: tx.reference });
        expect(resolved.status).toBe('MANUAL_REVIEW');
        expect(creditBalanceMock).not.toHaveBeenCalled();
    });

    test('a fresh (non-stale) QUOTA_CHECKING transaction is left untouched by reconciliation', async () => {
        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        tx.status = 'QUOTA_CHECKING';
        await tx.save();

        await Service.runReconciliationPass();

        const resolved = await fakeAirtimeCashTransaction.findOne({ reference: tx.reference });
        expect(resolved.status).toBe('QUOTA_CHECKING');
    });

    // --- Fix 2: atomic/concurrent wallet credit ---------------------------------

    test('two simultaneous credit attempts for the same transaction result in exactly one successful wallet credit', async () => {
        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        tx = await Service.verifyOtp({ reference: tx.reference, customerId: 'cust1', otp: '1234' });
        tx = await Service.checkAvailability({ reference: tx.reference, customerId: 'cust1' });

        // A deliberately slow credit call widens the race window so that, without
        // the atomic claim, both concurrent reconciliation passes would reach
        // creditBalance() before either finishes.
        let creditCalls = 0;
        creditBalanceMock = jest.fn(async () => {
            creditCalls += 1;
            await new Promise((resolve) => setTimeout(resolve, 15));
            return { balance1: 1000 };
        });

        // Simulate the provider having confirmed success but the credit not yet
        // applied -- the exact "recoverable" state creditWalletExactlyOnce's atomic
        // claim is meant to protect.
        tx.status = 'PROCESSING';
        tx.providerConfirmedAt = new Date();
        tx.walletCredited = false;
        await tx.save();

        // Two reconciliation passes racing for the same transaction, exactly as
        // could happen if one pass is still running (slow provider/DB) when the
        // next scheduled tick fires.
        await Promise.all([Service.runReconciliationPass(), Service.runReconciliationPass()]);

        expect(creditCalls).toBe(1); // exactly one attempt ever reached creditBalance()
        const resolved = await fakeAirtimeCashTransaction.findOne({ reference: tx.reference });
        expect(resolved.status).toBe('SUCCESS');
        expect(resolved.walletCredited).toBe(true);
    });

    test('same walletCreditReference is used across a failed attempt and its retry', async () => {
        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        tx = await Service.verifyOtp({ reference: tx.reference, customerId: 'cust1', otp: '1234' });
        tx = await Service.checkAvailability({ reference: tx.reference, customerId: 'cust1' });

        creditBalanceMock = jest.fn(async () => null); // fails first
        tx = await Service.transfer({ reference: tx.reference, customerId: 'cust1', transferPin: '1111' });
        const referenceAfterFirstAttempt = tx.walletCreditReference;
        expect(referenceAfterFirstAttempt).toBeTruthy();

        creditBalanceMock = jest.fn(async () => ({ balance1: 1000 })); // succeeds on retry
        await Service.runReconciliationPass();

        const resolved = await fakeAirtimeCashTransaction.findOne({ reference: tx.reference });
        expect(resolved.walletCreditReference).toBe(referenceAfterFirstAttempt);
        expect(creditBalanceMock).toHaveBeenCalledWith(expect.anything(), expect.anything(), referenceAfterFirstAttempt, expect.any(String));
    });

    test('provider.transfer() is never called again merely because a wallet credit is pending/retried', async () => {
        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        tx = await Service.verifyOtp({ reference: tx.reference, customerId: 'cust1', otp: '1234' });
        tx = await Service.checkAvailability({ reference: tx.reference, customerId: 'cust1' });

        let transferCallCount = 0;
        const realProvider = new MockAirtimeToCashProvider();
        providerOverride = {
            transfer: async (...args) => { transferCallCount += 1; return realProvider.transfer(...args); },
            checkStatus: async (...args) => realProvider.checkStatus(...args)
        };

        creditBalanceMock = jest.fn(async () => null); // wallet credit fails on first attempt
        tx = await Service.transfer({ reference: tx.reference, customerId: 'cust1', transferPin: '1111' });
        expect(tx.status).toBe('PROCESSING');
        expect(transferCallCount).toBe(1);

        creditBalanceMock = jest.fn(async () => ({ balance1: 1000 }));
        await Service.runReconciliationPass();
        await Service.runReconciliationPass(); // a second pass, for good measure

        expect(transferCallCount).toBe(1); // still exactly one -- reconciliation only ever retried the credit
    });
});

describe('Reseller authorization (Fix 1 regression)', () => {
    let restrictToBusinessSession, restrictToBasicOrPremium;

    beforeAll(async () => {
        ({ restrictToBusinessSession } = await import('../middlewares/auth.js'));
        ({ restrictToBasicOrPremium } = await import('../middlewares/tierMiddleware.js'));
    });

    function makeRes() {
        const res = {};
        res.status = jest.fn(() => res);
        res.json = jest.fn(() => res);
        return res;
    }

    // Exercises the exact middleware combination used by
    // routes/reseller/resellerAirtimeCashRoutes.js (auth already having populated
    // req.user/req.session_type by this point -- these tests construct that output
    // directly for each scenario rather than mocking JWT/DB, since that output is
    // exactly what the fix changes the route's behavior in response to).
    function runGuardChain(req) {
        const res = makeRes();
        const next = jest.fn();
        restrictToBusinessSession(req, res, next);
        if (res.status.mock.calls.length > 0) return { allowed: false, res };
        restrictToBasicOrPremium(req, res, next);
        return { allowed: res.status.mock.calls.length === 0, res };
    }

    test('reseller_admin managing their own site (main domain, business session) is allowed', () => {
        const req = { user: { role: 'reseller_admin' }, session_type: 'business' };
        const { allowed } = runGuardChain(req);
        expect(allowed).toBe(true);
    });

    test('platform admin is allowed regardless of session_type', () => {
        const req = { user: { role: 'admin' }, session_type: 'retail' };
        const { allowed } = runGuardChain(req);
        expect(allowed).toBe(true);
    });

    test('an ordinary customer/visitor on a reseller domain is denied (role masked to "user", session_type forced to "retail" by auth.js\'s Proxy)', () => {
        // This is exactly the req shape middlewares/auth.js produces for ANY
        // authenticated request once req.reseller is set, regardless of the real
        // user's actual role -- see auth.js's Proxy wrapper.
        const req = { user: { role: 'user' }, session_type: 'retail' };
        const { allowed } = runGuardChain(req);
        expect(allowed).toBe(false);
    });

    test('a plain retail user (no reseller privileges, main domain) is denied', () => {
        const req = { user: { role: 'user' }, session_type: 'retail' };
        const { allowed } = runGuardChain(req);
        expect(allowed).toBe(false);
    });

    test('a reseller_admin whose session_type is not yet "business" (e.g. mid-login) is denied rather than trusted on role alone', () => {
        const req = { user: { role: 'reseller_admin' }, session_type: 'retail' };
        const { allowed } = runGuardChain(req);
        expect(allowed).toBe(false);
    });
});

describe('AirtimeBridgeProvider (real HTTP client, mocked at the network layer with nock -- no live call)', () => {
    let AirtimeBridgeProvider, ProviderContractMissingError, nock, provider;
    const BASE_URL = 'https://automation.airtimetocash.com';

    beforeAll(async () => {
        nock = (await import('nock')).default;
        ({ AirtimeBridgeProvider, ProviderContractMissingError } = await import('../services/airtimeToCash/providers/airtimeBridgeProvider.js'));
    });

    beforeEach(() => {
        provider = new AirtimeBridgeProvider({ apiBaseUrl: BASE_URL, apiToken: 'test-token-123', isTestMode: false });
    });

    afterEach(() => {
        nock.cleanAll();
    });

    test('requestOtp: no Authorization header is sent (documented as unauthenticated)', async () => {
        const scope = nock(BASE_URL, { badheaders: ['authorization'] })
            .post('/api/v1/generate/otp', { networkName: 'MTN', sender: '08031234567' })
            .reply(200, { code: 2000, message: 'Otp sent successfully to +23480*****67' });

        const res = await provider.requestOtp({ network: 'MTN', phone: '08031234567' });
        expect(res.success).toBe(true);
        expect(scope.isDone()).toBe(true);
    });

    test('a configured base URL with a trailing /api does not double up into /api/api/v1/... (production 405 regression)', async () => {
        const trailingApiProvider = new AirtimeBridgeProvider({
            apiBaseUrl: `${BASE_URL}/api`,
            apiToken: 'test-token-123',
            isTestMode: false
        });
        const scope = nock(BASE_URL)
            .post('/api/v1/generate/otp', { networkName: 'MTN', sender: '08031234567' })
            .reply(200, { code: 2000, message: 'Otp sent successfully to +23480*****67' });

        const res = await trailingApiProvider.requestOtp({ network: 'MTN', phone: '08031234567' });
        expect(res.success).toBe(true);
        expect(scope.isDone()).toBe(true);
    });

    test('verifyOtp: success returns the sessionId from data.sessionId', async () => {
        nock(BASE_URL)
            .post('/api/v1/verify/otp', { networkName: 'MTN', sender: '08031234567', otp: '123456' })
            .reply(200, { code: 2000, message: 'Otp verified.', data: { airtimeBalance: '₦0.42', tariff: 'SMEPlus', type: 'Prepaid', sessionId: '20230521232229|744673|18' } });

        const res = await provider.verifyOtp({ network: 'MTN', phone: '08031234567', otp: '123456' });
        expect(res.success).toBe(true);
        expect(res.data.sessionId).toBe('20230521232229|744673|18');
    });

    test('verifyOtp: a non-2000 code is a clean failure, not an exception', async () => {
        nock(BASE_URL).post('/api/v1/verify/otp').reply(200, { code: 3000, message: 'Invalid OTP' });
        const res = await provider.verifyOtp({ network: 'MTN', phone: '08031234567', otp: '000000' });
        expect(res.success).toBe(false);
        expect(res.status).toBe('failed');
    });

    test('checkAvailability: sends the Authorization: Bearer header, and code 2000 is success', async () => {
        const scope = nock(BASE_URL, { reqheaders: { authorization: 'Bearer test-token-123' } })
            .post('/api/v1/check/quota/availability', { networkName: 'MTN', amount: 1000 })
            .reply(200, { code: 2000, message: 'ok' });

        const res = await provider.checkAvailability({ network: 'MTN', amount: 1000 });
        expect(res.success).toBe(true);
        expect(scope.isDone()).toBe(true);
    });

    test('checkAvailability: the documented code-5030 "Recipient(s) Available" example is treated as success', async () => {
        nock(BASE_URL).post('/api/v1/check/quota/availability').reply(200, { code: 5030, message: 'Recipient(s) Available' });
        const res = await provider.checkAvailability({ network: 'MTN', amount: 1000 });
        expect(res.success).toBe(true);
    });

    test('checkAvailability: code 5030 WITHOUT an "available" message falls back to the generic table meaning (unavailable/failed)', async () => {
        nock(BASE_URL).post('/api/v1/check/quota/availability').reply(200, { code: 5030, message: 'Service temporarily unavailable' });
        const res = await provider.checkAvailability({ network: 'MTN', amount: 1000 });
        expect(res.success).toBe(false);
    });

    test('transfer: throws before making any request if sessionId is missing', async () => {
        await expect(provider.transfer({ network: 'MTN', phone: '08031234567', amount: 1000, transferPin: '1111', reference: 'AC2C-TEST-REF-001' }))
            .rejects.toThrow(/sessionId/);
    });

    test('transfer: success sends reference/pin/sessionId in the body and reports success', async () => {
        const scope = nock(BASE_URL, { reqheaders: { authorization: 'Bearer test-token-123' } })
            .post('/api/v1/transfer/airtime', {
                networkName: 'MTN',
                sender: '08031234567',
                amount: 1000,
                reference: 'AC2C-TEST-REF-001',
                pin: '1111',
                sessionId: '20230521232229|744673|18'
            })
            .reply(200, {
                code: 2000,
                message: 'Yello! You have gifted...',
                data: { amountConverted: '₦1000', recipient: '234****67', balanceBefore: '₦1', balanceAfter: '₦0', automationCharges: '₦2', sessionId: '20230521232229|744673|18' }
            });

        const res = await provider.transfer({ network: 'MTN', phone: '08031234567', amount: 1000, transferPin: '1111', sessionId: '20230521232229|744673|18', reference: 'AC2C-TEST-REF-001' });
        expect(res.success).toBe(true);
        expect(res.status).toBe('success');
        expect(res.data.providerReference).toBe('AC2C-TEST-REF-001');
        expect(scope.isDone()).toBe(true);
    });

    test('transfer: code 4000 (pending) is ambiguous, not failed', async () => {
        nock(BASE_URL).post('/api/v1/transfer/airtime').reply(200, { code: 4000, message: 'Not sure of delivery' });
        const res = await provider.transfer({ network: 'MTN', phone: '08031234567', amount: 1000, transferPin: '1111', sessionId: 'sess-1', reference: 'AC2C-TEST-REF-002' });
        expect(res.status).toBe('ambiguous');
        expect(res.success).toBe(false);
    });

    test('transfer: code 4290 (too many requests) is treated as ambiguous, not a clean failure', async () => {
        nock(BASE_URL).post('/api/v1/transfer/airtime').reply(200, { code: 4290, message: 'Too many requests' });
        const res = await provider.transfer({ network: 'MTN', phone: '08031234567', amount: 1000, transferPin: '1111', sessionId: 'sess-1', reference: 'AC2C-TEST-REF-003' });
        expect(res.status).toBe('ambiguous');
    });

    test.each([
        [3000, 'failed'],
        [4010, 'failed'],
        [4030, 'failed'],
        [5030, 'failed']
    ])('transfer: code %i is a definite failure, not ambiguous', async (code) => {
        nock(BASE_URL).post('/api/v1/transfer/airtime').reply(200, { code, message: 'x' });
        const res = await provider.transfer({ network: 'MTN', phone: '08031234567', amount: 1000, transferPin: '1111', sessionId: 'sess-1', reference: 'AC2C-TEST-REF-004' });
        expect(res.status).toBe('failed');
        expect(res.success).toBe(false);
    });

    test('transfer: an HTTP 500 throws (caller\'s safeProviderCall treats it as ambiguous -- matches the documented "set to pending" convention)', async () => {
        nock(BASE_URL).post('/api/v1/transfer/airtime').reply(500, { error: 'boom' });
        await expect(provider.transfer({ network: 'MTN', phone: '08031234567', amount: 1000, transferPin: '1111', sessionId: 'sess-1', reference: 'AC2C-TEST-REF-005' }))
            .rejects.toThrow();
    });

    test('checkStatus: throws ProviderContractMissingError (no requery-by-reference endpoint is documented) without making any request', async () => {
        const scope = nock(BASE_URL).post(/.*/).reply(200, {});
        await expect(provider.checkStatus({ providerReference: 'AC2C-TEST-REF-001' })).rejects.toThrow(ProviderContractMissingError);
        expect(scope.isDone()).toBe(false); // never even tried to call anything
    });

    test('the transfer PIN never appears in a thrown error message', async () => {
        nock(BASE_URL).post('/api/v1/transfer/airtime').reply(200, { code: 3000, message: 'Invalid PIN' });
        const res = await provider.transfer({ network: 'MTN', phone: '08031234567', amount: 1000, transferPin: 'sekret-9999', sessionId: 'sess-1', reference: 'AC2C-TEST-REF-006' });
        expect(JSON.stringify(res)).not.toMatch(/sekret-9999/);
    });

    test('transfer: an unrecognized/malformed response (no known code) is ambiguous, never a guessed failure', async () => {
        nock(BASE_URL).post('/api/v1/transfer/airtime').reply(200, { unexpected: 'shape' });
        const res = await provider.transfer({ network: 'MTN', phone: '08031234567', amount: 1000, transferPin: '1111', sessionId: 'sess-1', reference: 'AC2C-TEST-REF-007' });
        expect(res.status).toBe('ambiguous');
        expect(res.success).toBe(false);
    });

    test('transfer: success captures amountConverted/recipient/balances/automationCharges for audit, alongside the reference', async () => {
        nock(BASE_URL).post('/api/v1/transfer/airtime').reply(200, {
            code: 2000,
            message: 'Yello!',
            data: { amountConverted: '₦1000', recipient: '234****67', balanceBefore: '₦5000', balanceAfter: '₦4000', automationCharges: '₦2', sessionId: 'sess-1' }
        });
        const res = await provider.transfer({ network: 'MTN', phone: '08031234567', amount: 1000, transferPin: '1111', sessionId: 'sess-1', reference: 'AC2C-TEST-REF-008' });
        expect(res.data.amountConverted).toBe('₦1000');
        expect(res.data.automationCharges).toBe('₦2');
        expect(res.data.providerReference).toBe('AC2C-TEST-REF-008');
    });

    test('loginWithSessionId: success returns the session snapshot', async () => {
        nock(BASE_URL, { reqheaders: { authorization: 'Bearer test-token-123' } })
            .post('/api/v1/login/with/session/id', { networkName: 'MTN', sender: '08031234567', sessionId: 'sess-1' })
            .reply(200, { code: 2000, message: 'Session record retrieved.', data: { airtimeBalance: '₦0.42', tariff: 'SMEPlus', type: 'Prepaid', sessionId: 'sess-1' } });

        const res = await provider.loginWithSessionId({ network: 'MTN', phone: '08031234567', sessionId: 'sess-1' });
        expect(res.success).toBe(true);
        expect(res.data.airtimeBalance).toBe('₦0.42');
    });

    test('loginWithSessionId: an expired session is a clean failure', async () => {
        nock(BASE_URL).post('/api/v1/login/with/session/id').reply(200, { code: 4010, message: 'Session expired' });
        const res = await provider.loginWithSessionId({ network: 'MTN', phone: '08031234567', sessionId: 'sess-1' });
        expect(res.success).toBe(false);
    });

    test.each([
        [401, 'Unauthorized'],
        [403, 'Forbidden'],
        [429, 'Too Many Requests']
    ])('transfer: HTTP %i throws (never interpreted as a confirmed outcome)', async (httpStatus) => {
        nock(BASE_URL).post('/api/v1/transfer/airtime').reply(httpStatus, { error: 'x' });
        await expect(provider.transfer({ network: 'MTN', phone: '08031234567', amount: 1000, transferPin: '1111', sessionId: 'sess-1', reference: 'AC2C-TEST-REF-009' }))
            .rejects.toThrow();
    });

    test('transfer: a network-level failure (provider unreachable) throws rather than being interpreted as any outcome', async () => {
        nock(BASE_URL).post('/api/v1/transfer/airtime').replyWithError('connect ECONNREFUSED');
        await expect(provider.transfer({ network: 'MTN', phone: '08031234567', amount: 1000, transferPin: '1111', sessionId: 'sess-1', reference: 'AC2C-TEST-REF-010' }))
            .rejects.toThrow();
    });

    test('transfer: a timed-out request throws rather than being interpreted as any outcome', async () => {
        nock(BASE_URL).post('/api/v1/transfer/airtime').replyWithError('timeout of 30000ms exceeded');
        await expect(provider.transfer({ network: 'MTN', phone: '08031234567', amount: 1000, transferPin: '1111', sessionId: 'sess-1', reference: 'AC2C-TEST-REF-011' }))
            .rejects.toThrow();
    });
});

describe('AirtimeBridgeProvider integrated through AirtimeToCashService (real provider, nock-mocked HTTP, fake DB)', () => {
    let Service, nock;
    const BASE_URL = 'https://automation.airtimetocash.com';

    beforeAll(async () => {
        nock = (await import('nock')).default;
        Service = await import('../services/airtimeToCash/AirtimeToCashService.js');
    });

    beforeEach(async () => {
        fakeAirtimeCashTransaction._store.length = 0;
        fakeAirtimeCashAuditLog._store.length = 0;
        fakeAirtimeCashPricing._store.length = 0;
        fakeNotification._store.length = 0;
        creditBalanceMock = jest.fn(async () => ({ balance1: 1000 }));
        providerOverride = new (await import('../services/airtimeToCash/providers/airtimeBridgeProvider.js')).AirtimeBridgeProvider({
            apiBaseUrl: BASE_URL,
            apiToken: 'test-token-123',
            isTestMode: false
        });
        await fakeAirtimeCashPricing.create({ tenantId: null, network: 'MTN', conversionPercentage: 80, fixedFee: 0, minAmount: 500, maxAmount: 50000, isEnabled: true });
    });

    afterEach(() => {
        nock.cleanAll();
    });

    async function driveToReadyForTransfer(phone = '08031234567') {
        nock(BASE_URL).post('/api/v1/generate/otp').reply(200, { code: 2000, message: 'sent' });
        nock(BASE_URL).post('/api/v1/verify/otp').reply(200, { code: 2000, message: 'verified', data: { sessionId: 'sess-real-1' } });
        nock(BASE_URL).post('/api/v1/check/quota/availability').reply(200, { code: 5030, message: 'Recipient(s) Available' });

        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone, amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        tx = await Service.verifyOtp({ reference: tx.reference, customerId: 'cust1', otp: '123456' });
        tx = await Service.checkAvailability({ reference: tx.reference, customerId: 'cust1' });
        return tx;
    }

    test('full real-provider flow: OTP -> verify (captures sessionId) -> availability -> transfer -> SUCCESS, wallet credited exactly once, provider accounting stored separately from 9jaSub payout', async () => {
        let tx = await driveToReadyForTransfer();
        expect(tx.status).toBe('READY_FOR_TRANSFER');
        expect(tx.providerSessionId).toBe('sess-real-1');
        expect(tx.customerPayoutAmount).toBe(8000); // 9jaSub's own pricing, untouched by the provider

        nock(BASE_URL).post('/api/v1/transfer/airtime', (body) => body.sessionId === 'sess-real-1' && body.reference === tx.reference)
            .reply(200, { code: 2000, message: 'Yello!', data: { amountConverted: '₦10000', recipient: '234****67', balanceBefore: '₦1', balanceAfter: '₦0', automationCharges: '₦2', sessionId: 'sess-real-1' } });

        tx = await Service.transfer({ reference: tx.reference, customerId: 'cust1', transferPin: '1111' });

        expect(tx.status).toBe('SUCCESS');
        expect(tx.walletCredited).toBe(true);
        expect(tx.customerPayoutAmount).toBe(8000); // still 9jaSub's own figure -- provider's amountConverted never overwrote it
        expect(tx.providerTransferData.amountConverted).toBe('₦10000'); // provider's figure preserved separately for audit
        expect(creditBalanceMock).toHaveBeenCalledWith('cust1', 8000, tx.walletCreditReference, expect.any(String));
    });

    test('HTTP 500 from the real provider during transfer results in MANUAL_REVIEW, not FAILED, and never credits the wallet', async () => {
        let tx = await driveToReadyForTransfer();
        nock(BASE_URL).post('/api/v1/transfer/airtime').reply(500, { error: 'boom' });

        tx = await Service.transfer({ reference: tx.reference, customerId: 'cust1', transferPin: '1111' });

        expect(tx.status).toBe('MANUAL_REVIEW');
        expect(creditBalanceMock).not.toHaveBeenCalled();
    });

    test('a network timeout from the real provider during transfer results in MANUAL_REVIEW, never an automatic retry of the transfer', async () => {
        let tx = await driveToReadyForTransfer();
        // Only ONE interceptor is registered (not .persist()) -- if the service
        // layer tried to call transfer a second time, that request would find no
        // matching mock and reject, which would fail this test. Reaching a clean
        // MANUAL_REVIEW result below is itself proof transfer was attempted
        // exactly once.
        nock(BASE_URL).post('/api/v1/transfer/airtime').replyWithError('timeout of 30000ms exceeded');

        tx = await Service.transfer({ reference: tx.reference, customerId: 'cust1', transferPin: '1111' });

        expect(tx.status).toBe('MANUAL_REVIEW');
        expect(creditBalanceMock).not.toHaveBeenCalled();
    });

    test('a malformed provider response during transfer results in MANUAL_REVIEW, not a guessed FAILED', async () => {
        let tx = await driveToReadyForTransfer();
        nock(BASE_URL).post('/api/v1/transfer/airtime').reply(200, { totally: 'unexpected' });

        tx = await Service.transfer({ reference: tx.reference, customerId: 'cust1', transferPin: '1111' });

        expect(tx.status).toBe('MANUAL_REVIEW');
        expect(creditBalanceMock).not.toHaveBeenCalled();
    });

    test('4010 session expired during transfer fails the transaction outright -- never retried automatically', async () => {
        let tx = await driveToReadyForTransfer();
        nock(BASE_URL).post('/api/v1/transfer/airtime').reply(200, { code: 4010, message: 'Session expired' });

        tx = await Service.transfer({ reference: tx.reference, customerId: 'cust1', transferPin: '1111' });

        expect(tx.status).toBe('FAILED');
        expect(creditBalanceMock).not.toHaveBeenCalled();
    });

    test('quota unavailable (5030 without an "Available" message) blocks the flow before transfer is ever attempted', async () => {
        nock(BASE_URL).post('/api/v1/generate/otp').reply(200, { code: 2000, message: 'sent' });
        nock(BASE_URL).post('/api/v1/verify/otp').reply(200, { code: 2000, message: 'verified', data: { sessionId: 'sess-real-2' } });
        nock(BASE_URL).post('/api/v1/check/quota/availability').reply(200, { code: 5030, message: 'Service temporarily unavailable' });

        let tx = await Service.requestOtp({ customerId: 'cust1', tenantId: null, network: 'MTN', phone: '08031234567', amount: 10000, bankName: 'GTBank', accountNumber: '0123456789' });
        tx = await Service.verifyOtp({ reference: tx.reference, customerId: 'cust1', otp: '123456' });
        tx = await Service.checkAvailability({ reference: tx.reference, customerId: 'cust1' });

        expect(tx.status).toBe('FAILED');
        expect(creditBalanceMock).not.toHaveBeenCalled();
    });
});
