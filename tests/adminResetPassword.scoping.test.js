// Unit tests for the tenant-scoping fix in
// controllers/adminController.js:adminResetPassword — previously any
// reseller_admin (via adminAuth) could reset the password of *any* user
// platform-wide by userId alone (IDOR / account takeover). This suite
// proves:
//   - reseller_admin CAN reset a password for their own tenant's customer.
//   - reseller_admin CANNOT reset a password for another tenant's customer.
//   - reseller_admin CANNOT reset another reseller's own password.
//   - admin/superadmin remain unrestricted, unchanged.
//
// Runs standalone — no live DB, no module mocking needed (this function has
// no walletService/emailService dependency). User/AdminLog static methods
// are monkey-patched.
//
// Run with: node --test-force-exit --test tests/adminResetPassword.scoping.test.js

import test from 'node:test';
import assert from 'node:assert/strict';

import { adminResetPassword } from '../controllers/adminController.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';

const RESELLER_ID = '507f1f77bcf86cd799439011';
const OTHER_RESELLER_ID = '507f1f77bcf86cd799439099';
const CUSTOMER_ID = '607f1f77bcf86cd799439022';

const makeRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

const withMocks = async ({ targetUser }, fn) => {
  const original = { userFindById: User.findById, adminLogCreate: AdminLog.create };
  const doc = { ...targetUser, password: 'old-hash', save: async function () { return this; } };
  try {
    User.findById = async (id) => (String(id) === String(targetUser._id) ? doc : null);
    AdminLog.create = async () => ({});
    await fn(doc);
  } finally {
    User.findById = original.userFindById;
    AdminLog.create = original.adminLogCreate;
  }
};

test('adminResetPassword: reseller_admin CAN reset their own tenant\'s customer password', async () => {
  const targetUser = { _id: CUSTOMER_ID, tenantOwnerId: RESELLER_ID };
  await withMocks({ targetUser }, async (doc) => {
    const req = { body: { userId: CUSTOMER_ID, newPassword: 'NewPass123!' }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
    const res = makeRes();
    await adminResetPassword(req, res);
    assert.equal(res.statusCode, null);
    assert.equal(res.body.message, 'Password reset successfully');
    assert.notEqual(doc.password, 'old-hash', 'password must have been changed');
  });
});

test('adminResetPassword: reseller_admin CANNOT reset another tenant\'s customer password (IDOR closed → 403)', async () => {
  const targetUser = { _id: CUSTOMER_ID, tenantOwnerId: OTHER_RESELLER_ID };
  await withMocks({ targetUser }, async (doc) => {
    const req = { body: { userId: CUSTOMER_ID, newPassword: 'NewPass123!' }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
    const res = makeRes();
    await adminResetPassword(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(doc.password, 'old-hash', 'password must NOT have been changed');
  });
});

test('adminResetPassword: reseller_admin CANNOT reset another reseller\'s own password (no tenantOwnerId → 403)', async () => {
  const targetUser = { _id: OTHER_RESELLER_ID, tenantOwnerId: undefined, role: 'reseller_admin' };
  await withMocks({ targetUser }, async (doc) => {
    const req = { body: { userId: OTHER_RESELLER_ID, newPassword: 'NewPass123!' }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
    const res = makeRes();
    await adminResetPassword(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(doc.password, 'old-hash');
  });
});

for (const role of ['admin', 'superadmin']) {
  test(`adminResetPassword: ${role} remains unrestricted (any tenant, unchanged)`, async () => {
    const targetUser = { _id: CUSTOMER_ID, tenantOwnerId: OTHER_RESELLER_ID };
    await withMocks({ targetUser }, async (doc) => {
      const req = { body: { userId: CUSTOMER_ID, newPassword: 'NewPass123!' }, user: { _id: 'staff-id', role } };
      const res = makeRes();
      await adminResetPassword(req, res);
      assert.equal(res.statusCode, null, `${role} should not be blocked by tenant scoping`);
      assert.notEqual(doc.password, 'old-hash');
    });
  });
}
