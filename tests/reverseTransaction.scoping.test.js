// Unit tests for the tenant-scoping fix in
// controllers/adminController.js:reverseTransaction — previously any
// reseller_admin (via adminAuth) could reverse *any* transaction platform-
// wide by transactionId alone (IDOR), refunding/deducting whatever
// customer/reseller the transaction happened to reference. This suite
// proves:
//   - reseller_admin CAN reverse a transaction belonging to their own
//     tenant's customer.
//   - reseller_admin CANNOT reverse a transaction belonging to another
//     tenant's (or the main platform's) customer.
//   - admin/superadmin remain unrestricted, unchanged.
//
// Runs standalone — no live DB. Transaction/User/AdminLog static methods
// are monkey-patched; services/walletService.js's refundBalance (a bare
// named export, not mockable via simple property assignment across an ESM
// boundary) is mocked via Node's built-in experimental module mocking.
//
// Run with: node --experimental-test-module-mocks --test tests/reverseTransaction.scoping.test.js

import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';

import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';

const refundCalls = [];
mock.module('../services/walletService.js', {
  namedExports: {
    refundBalance: async (userId, amount) => { refundCalls.push({ userId: String(userId), amount }); return { balance1: 0 }; },
    creditBalance: async () => ({}),
    deductBalance: async () => ({}),
    refundEarnings: async () => ({}),
    creditEarnings: async () => ({}),
    deductEarnings: async () => ({}),
  },
});

const { reverseTransaction } = await import('../controllers/adminController.js');

const RESELLER_ID = '507f1f77bcf86cd799439011';
const OTHER_RESELLER_ID = '507f1f77bcf86cd799439099';
const CUSTOMER_ID = '607f1f77bcf86cd799439022';
const TX_ID = '707f1f77bcf86cd799439033';

const makeRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

const withMocks = async ({ tenantOwnerId }, fn) => {
  const original = {
    txFindById: Transaction.findById,
    userFindById: User.findById,
    adminLogCreate: AdminLog.create,
  };
  const tx = {
    _id: TX_ID, userId: CUSTOMER_ID, status: 'success', type: 'debit', amount: 1000, profit: 0,
    description: '', save: async function () { return this; },
  };
  const customer = { _id: CUSTOMER_ID, tenantOwnerId, referredBy: undefined };
  try {
    Transaction.findById = async (id) => (String(id) === TX_ID ? tx : null);
    User.findById = async (id) => (String(id) === CUSTOMER_ID ? customer : null);
    AdminLog.create = async () => ({});
    await fn(tx);
  } finally {
    Transaction.findById = original.txFindById;
    User.findById = original.userFindById;
    AdminLog.create = original.adminLogCreate;
  }
};

test('reverseTransaction: reseller_admin CAN reverse their own tenant\'s customer transaction', async () => {
  refundCalls.length = 0;
  await withMocks({ tenantOwnerId: RESELLER_ID }, async () => {
    const req = { body: { transactionId: TX_ID }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
    const res = makeRes();
    await reverseTransaction(req, res);
    assert.equal(res.statusCode, null, 'should not be rejected');
    assert.equal(res.body.message, 'Transaction reversed and funds refunded.');
    assert.equal(refundCalls.length, 1, 'refundBalance should have been called');
    assert.equal(refundCalls[0].userId, CUSTOMER_ID);
  });
});

test('reverseTransaction: reseller_admin CANNOT reverse another tenant\'s customer transaction (IDOR closed → 403)', async () => {
  refundCalls.length = 0;
  await withMocks({ tenantOwnerId: OTHER_RESELLER_ID }, async () => {
    const req = { body: { transactionId: TX_ID }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
    const res = makeRes();
    await reverseTransaction(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /your own customers/i);
    assert.equal(refundCalls.length, 0, 'refundBalance must NOT be called when denied');
  });
});

test('reverseTransaction: reseller_admin CANNOT reverse a main-platform (no tenantOwnerId) transaction', async () => {
  refundCalls.length = 0;
  await withMocks({ tenantOwnerId: undefined }, async () => {
    const req = { body: { transactionId: TX_ID }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
    const res = makeRes();
    await reverseTransaction(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(refundCalls.length, 0);
  });
});

for (const role of ['admin', 'superadmin']) {
  test(`reverseTransaction: ${role} remains unrestricted (any tenant, unchanged)`, async () => {
    refundCalls.length = 0;
    await withMocks({ tenantOwnerId: OTHER_RESELLER_ID }, async () => {
      const req = { body: { transactionId: TX_ID }, user: { _id: 'staff-id', role } };
      const res = makeRes();
      await reverseTransaction(req, res);
      assert.equal(res.statusCode, null, `${role} should not be blocked by tenant scoping`);
      assert.equal(refundCalls.length, 1);
    });
  });
}
