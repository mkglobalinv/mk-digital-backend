// Unit tests for the tenant-scoping fix in
// controllers/adminController.js:approveWithdrawal/rejectWithdrawal —
// previously any reseller_admin (via adminAuth) could approve or reject
// *any* withdrawal platform-wide by withdrawalId alone, including their own
// (self-approval) or another reseller's. Withdrawal approval verifies a
// real-world bank transfer was completed and must stay staff-only, since a
// withdrawal's owner is always a reseller directly (never a "customer" of
// one) — under the existing tenant model, a reseller_admin therefore has no
// legitimate withdrawal to approve/reject at all. This suite proves:
//   - reseller_admin CANNOT approve/reject their own withdrawal
//     (self-approval closed).
//   - reseller_admin CANNOT approve/reject another reseller's withdrawal.
//   - admin/superadmin remain unrestricted, unchanged.
//
// Runs standalone — no live DB. Withdrawal/Transaction/Notification/User/
// AdminLog static methods are monkey-patched; services/walletService.js's
// refundEarnings (used only by rejectWithdrawal, a bare named export) is
// mocked via Node's built-in experimental module mocking.
//
// Run with: node --experimental-test-module-mocks --test-force-exit --test tests/withdrawalApproval.scoping.test.js

import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';

import Withdrawal from '../models/Withdrawal.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';

const refundEarningsCalls = [];
mock.module('../services/walletService.js', {
  namedExports: {
    refundEarnings: async (userId, amount) => { refundEarningsCalls.push({ userId: String(userId), amount }); return {}; },
    refundBalance: async () => ({}),
    creditBalance: async () => ({}),
    deductBalance: async () => ({}),
    creditEarnings: async () => ({}),
    deductEarnings: async () => ({}),
  },
});

const { approveWithdrawal, rejectWithdrawal } = await import('../controllers/adminController.js');

const RESELLER_ID = '507f1f77bcf86cd799439011';
const OTHER_RESELLER_ID = '507f1f77bcf86cd799439099';
const WD_ID = '707f1f77bcf86cd799439044';

const makeRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

const withMocks = async ({ withdrawalOwnerId }, fn) => {
  const original = {
    wdFindById: Withdrawal.findById,
    txFindByIdAndUpdate: Transaction.findByIdAndUpdate,
    notifCreate: Notification.create,
    userFindById: User.findById,
    adminLogCreate: AdminLog.create,
  };
  const w = {
    _id: WD_ID, userId: withdrawalOwnerId, status: 'pending', amount: 5000, reference: 'WD-1', transactionId: null,
    save: async function () { return this; },
  };
  // A withdrawal's owner is always a reseller-tier account — it never has a
  // tenantOwnerId of its own, matching the real data model exactly.
  const owner = { _id: withdrawalOwnerId, role: 'reseller_admin', tenantOwnerId: undefined };
  try {
    Withdrawal.findById = async (id) => (String(id) === WD_ID ? w : null);
    Transaction.findByIdAndUpdate = async () => ({});
    Notification.create = async () => ({});
    User.findById = async (id) => (String(id) === String(withdrawalOwnerId) ? owner : null);
    AdminLog.create = async () => ({});
    await fn(w);
  } finally {
    Withdrawal.findById = original.wdFindById;
    Transaction.findByIdAndUpdate = original.txFindByIdAndUpdate;
    Notification.create = original.notifCreate;
    User.findById = original.userFindById;
    AdminLog.create = original.adminLogCreate;
  }
};

test('approveWithdrawal: reseller_admin CANNOT approve their own withdrawal (self-approval closed → 403)', async () => {
  await withMocks({ withdrawalOwnerId: RESELLER_ID }, async (w) => {
    const req = { body: { withdrawalId: WD_ID }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
    const res = makeRes();
    await approveWithdrawal(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(w.status, 'pending', 'status must be unchanged');
  });
});

test('approveWithdrawal: reseller_admin CANNOT approve another reseller\'s withdrawal (IDOR closed → 403)', async () => {
  await withMocks({ withdrawalOwnerId: OTHER_RESELLER_ID }, async (w) => {
    const req = { body: { withdrawalId: WD_ID }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
    const res = makeRes();
    await approveWithdrawal(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(w.status, 'pending');
  });
});

for (const role of ['admin', 'superadmin']) {
  test(`approveWithdrawal: ${role} remains unrestricted (unchanged)`, async () => {
    await withMocks({ withdrawalOwnerId: OTHER_RESELLER_ID }, async (w) => {
      const req = { body: { withdrawalId: WD_ID }, user: { _id: 'staff-id', role } };
      const res = makeRes();
      await approveWithdrawal(req, res);
      assert.equal(res.statusCode, null, `${role} should not be blocked`);
      assert.equal(w.status, 'approved');
    });
  });
}

test('rejectWithdrawal: reseller_admin CANNOT reject their own withdrawal (self-rejection closed → 403, no refund issued)', async () => {
  refundEarningsCalls.length = 0;
  await withMocks({ withdrawalOwnerId: RESELLER_ID }, async (w) => {
    const req = { body: { withdrawalId: WD_ID, reason: 'test' }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
    const res = makeRes();
    await rejectWithdrawal(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(w.status, 'pending');
    assert.equal(refundEarningsCalls.length, 0);
  });
});

test('rejectWithdrawal: admin remains unrestricted (unchanged, refund issued)', async () => {
  refundEarningsCalls.length = 0;
  await withMocks({ withdrawalOwnerId: OTHER_RESELLER_ID }, async (w) => {
    const req = { body: { withdrawalId: WD_ID, reason: 'test' }, user: { _id: 'staff-id', role: 'admin' } };
    const res = makeRes();
    await rejectWithdrawal(req, res);
    assert.equal(res.statusCode, null);
    assert.equal(w.status, 'rejected');
    assert.equal(refundEarningsCalls.length, 1);
  });
});
