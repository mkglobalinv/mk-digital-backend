// Unit tests for the Flutterwave-verify IDOR fix in
// controllers/flutterwaveController.js:settleTransaction. Two independent
// bugs previously let an attacker who knows/observes any real Flutterwave
// transactionId under the merchant account get their own wallet credited
// with someone else's payment:
//   1. `finalTxRef = txRef || flwTxRef` trusted a caller-supplied txRef over
//      the reference Flutterwave itself recorded, letting an attacker's
//      fabricated txRef dodge the "is there already a pending Transaction
//      for this reference" lookup.
//   2. When no local Transaction matched, the payer was resolved to
//      "whoever is currently authenticated" (authUserId) with no check that
//      they were actually who Flutterwave says paid.
// This suite proves both are fixed, and that the webhook settlement path
// (authUserId === null) is unaffected.
//
// Runs standalone — no live DB. Transaction/User static methods are
// monkey-patched; services/flutterwaveService.js, services/emailService.js
// and services/walletService.js (bare named exports, not mockable via
// simple property assignment across an ESM boundary) are mocked via Node's
// built-in experimental module mocking.
//
// Run with: node --experimental-test-module-mocks --test-force-exit --test tests/flutterwaveVerify.idor.test.js

import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';

import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

const creditCalls = [];
let flwVerificationResponse = null;

mock.module('../services/flutterwaveService.js', {
  namedExports: {
    verifyFlutterwaveTransaction: async () => flwVerificationResponse,
  },
});
mock.module('../services/emailService.js', {
  namedExports: { sendTransactionNotification: async () => {} },
});
mock.module('../services/walletService.js', {
  namedExports: {
    creditBalance: async (userId, amount, reference, description) => {
      creditCalls.push({ userId: String(userId), amount, reference, description });
      return { _id: userId, balance1: amount };
    },
  },
});

const { settleTransaction } = await import('../controllers/flutterwaveController.js');

const VICTIM_ID = '507f1f77bcf86cd799439011';
const ATTACKER_ID = '507f1f77bcf86cd799439099';
const VICTIM_EMAIL = 'victim@example.com';
const ATTACKER_EMAIL = 'attacker@example.com';
const FLW_TXN_ID = '999888777';
const REAL_TX_REF = 'REAL-REF-001';

const usersById = {
  [VICTIM_ID]: { _id: VICTIM_ID, email: VICTIM_EMAIL, accountType: 'permanent' },
  [ATTACKER_ID]: { _id: ATTACKER_ID, email: ATTACKER_EMAIL, accountType: 'permanent' },
};

const withMocks = async ({ existingTransaction }, fn) => {
  const original = {
    txFindOne: Transaction.findOne,
    txFindOneAndUpdate: Transaction.findOneAndUpdate,
    txCreate: Transaction.create,
    userFindById: User.findById,
  };
  try {
    const matchesClause = (clause) => Object.entries(clause).every(
      ([key, val]) => existingTransaction[key] !== undefined && String(existingTransaction[key]) === String(val)
    );
    Transaction.findOne = async (query) => {
      if (!existingTransaction) return null;
      const clauses = query.$or || [query];
      return clauses.some(matchesClause) ? existingTransaction : null;
    };
    Transaction.findOneAndUpdate = async (filter, update) => {
      if (existingTransaction && String(filter._id) === String(existingTransaction._id)) {
        Object.assign(existingTransaction, update);
        return existingTransaction;
      }
      return null;
    };
    Transaction.create = async (doc) => ({ _id: 'new-tx-id', ...doc });
    User.findById = async (id) => usersById[String(id)] || null;
    await fn();
  } finally {
    Transaction.findOne = original.txFindOne;
    Transaction.findOneAndUpdate = original.txFindOneAndUpdate;
    Transaction.create = original.txCreate;
    User.findById = original.userFindById;
  }
};

test('settleTransaction: trusts Flutterwave\'s own tx_ref over a caller-supplied one, crediting the real payer', async () => {
  creditCalls.length = 0;
  flwVerificationResponse = {
    status: 'success',
    data: { status: 'successful', amount: 5000, currency: 'NGN', customer: { email: VICTIM_EMAIL }, tx_ref: REAL_TX_REF },
  };
  const existingTransaction = {
    _id: 'pending-tx-1', userId: VICTIM_ID, reference: REAL_TX_REF, type: 'credit', status: 'pending',
  };
  await withMocks({ existingTransaction }, async () => {
    // Attacker supplies a fabricated txRef that matches no local Transaction,
    // trying to dodge the lookup that would otherwise attribute this payment
    // to the victim. authUserId = attacker's own id (they're calling
    // /flutterwave/verify authenticated as themselves).
    const result = await settleTransaction(FLW_TXN_ID, 'ATTACKER-FAKE-REF', ATTACKER_ID, null);
    assert.equal(result.success, true);
    assert.equal(creditCalls.length, 1);
    assert.equal(creditCalls[0].userId, VICTIM_ID, 'the real payer (victim) must be credited, not the attacker');
  });
});

test('settleTransaction: authenticated-fallback path rejects when Flutterwave\'s payer email does not match the caller (IDOR closed)', async () => {
  creditCalls.length = 0;
  flwVerificationResponse = {
    status: 'success',
    data: { status: 'successful', amount: 7500, currency: 'NGN', customer: { email: VICTIM_EMAIL }, tx_ref: 'SOME-OTHER-REF-NOT-LOCAL' },
  };
  // No existing local Transaction anywhere — the fallback-to-authUserId path
  // is the only way this could resolve a payer.
  await withMocks({ existingTransaction: null }, async () => {
    await assert.rejects(
      () => settleTransaction(FLW_TXN_ID, undefined, ATTACKER_ID, null),
      /identity mismatch/i,
      'must refuse to credit the attacker when Flutterwave says someone else paid'
    );
    assert.equal(creditCalls.length, 0, 'wallet must NOT be credited');
  });
});

test('settleTransaction: authenticated-fallback path succeeds when caller\'s email matches Flutterwave\'s payer (legitimate case)', async () => {
  creditCalls.length = 0;
  flwVerificationResponse = {
    status: 'success',
    data: { status: 'successful', amount: 2000, currency: 'NGN', customer: { email: VICTIM_EMAIL }, tx_ref: 'LEGIT-NEW-REF' },
  };
  await withMocks({ existingTransaction: null }, async () => {
    const result = await settleTransaction(FLW_TXN_ID, undefined, VICTIM_ID, null);
    assert.equal(result.success, true);
    assert.equal(creditCalls.length, 1);
    assert.equal(creditCalls[0].userId, VICTIM_ID);
  });
});

test('settleTransaction: webhook path (authUserId=null) is unaffected by the identity-mismatch guard', async () => {
  creditCalls.length = 0;
  flwVerificationResponse = {
    status: 'success',
    data: { status: 'successful', amount: 3000, currency: 'NGN', customer: { email: VICTIM_EMAIL }, tx_ref: 'VA-WEBHOOK-REF' },
  };
  await withMocks({ existingTransaction: null }, async () => {
    // Simulates a virtual-account transfer webhook resolving the user via
    // account number — authUserId is always null for webhook-driven calls,
    // so attributedViaAuthFallback must be false and the new guard must not
    // fire here.
    const originalFindOne = User.findOne;
    User.findOne = async (query) => {
      if (query.$or?.some((c) => c.account_number === '1234567890')) return usersById[VICTIM_ID];
      return null;
    };
    try {
      const result = await settleTransaction(FLW_TXN_ID, undefined, null, { virtual_account_number: '1234567890' });
      assert.equal(result.success, true);
      assert.equal(creditCalls.length, 1);
      assert.equal(creditCalls[0].userId, VICTIM_ID);
    } finally {
      User.findOne = originalFindOne;
    }
  });
});
