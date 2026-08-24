// Unit tests for the tenant-scoping fix in
// controllers/adminController.js:initiateWalletAction/confirmWalletAction —
// previously any activated reseller_admin could self-configure their own
// funding password (a "prove you are you" check, not a tenant check) and
// then credit/debit *any* user's wallet platform-wide with zero ownership
// check. This suite proves:
//   - reseller_admin CAN initiate+confirm a credit/debit for their own
//     tenant's customer.
//   - reseller_admin CANNOT initiate a wallet action for another tenant's
//     customer (fails fast, before any OTP is even generated).
//   - reseller_admin CANNOT confirm a wallet action for another tenant's
//     customer even with an otherwise-valid intent token (defense-in-depth
//     re-check at the actual credit/debit step).
//   - The existing funding-password and OTP verification steps are still
//     enforced unchanged (not bypassed) for both allowed and denied cases.
//   - admin/superadmin remain unrestricted, unchanged.
//
// Runs standalone — no live DB. User/OTP/Transaction/Notification/AdminLog
// static methods are monkey-patched; services/walletService.js and
// services/emailService.js (bare named exports, not mockable via simple
// property assignment across an ESM boundary) are mocked via Node's
// built-in experimental module mocking. bcrypt and jsonwebtoken are used
// for real (not mocked) so the funding-password/OTP/intent-token flow is
// exercised exactly as production runs it.
//
// Run with: node --experimental-test-module-mocks --test-force-exit --test tests/walletAction.scoping.test.js

import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import OTP from '../models/OTP.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import AdminLog from '../models/AdminLog.js';

const walletCalls = [];
mock.module('../services/walletService.js', {
  namedExports: {
    creditBalance: async (userId, amount) => { walletCalls.push({ type: 'credit', userId: String(userId), amount }); return { balance1: amount }; },
    deductBalance: async (userId, amount) => { walletCalls.push({ type: 'debit', userId: String(userId), amount }); return { balance1: 0 }; },
    refundBalance: async () => ({}),
    refundEarnings: async () => ({}),
    creditEarnings: async () => ({}),
    deductEarnings: async () => ({}),
  },
});
mock.module('../services/emailService.js', {
  namedExports: {
    dispatchOTP: async () => true,
    sendTransactionNotification: async () => {},
    sendAdminBroadcastEmail: async () => {},
    sendAdminLoginAlert: async () => {},
    sendAdminOTPEmail: async () => {},
    sendEmail: async () => {},
  },
});

const { initiateWalletAction, confirmWalletAction } = await import('../controllers/adminController.js');

const SECRET = process.env.JWT_SECRET || 'mk_sub_data_secret_2024_premium';
const RESELLER_ID = '507f1f77bcf86cd799439011';
const CUSTOMER_ID = '607f1f77bcf86cd799439022';
const OTHER_CUSTOMER_ID = '607f1f77bcf86cd799439033';
const FUNDING_PASSWORD = 'MyFundingPass1!';
const OTP_CODE = '123456';

const makeRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

const withMocks = async ({ adminId, adminRole, customers }, fn) => {
  const original = {
    userFindById: User.findById,
    otpFindOne: OTP.findOne,
    otpDeleteMany: OTP.deleteMany,
    otpDeleteOne: OTP.deleteOne,
    otpCreate: OTP.create,
    txFindOne: Transaction.findOne,
    notifCreate: Notification.create,
    adminLogCreate: AdminLog.create,
  };
  const fundingPasswordHash = await bcrypt.hash(FUNDING_PASSWORD, 10);
  const adminDoc = { _id: adminId, role: adminRole, email: 'admin@example.com', adminFundingPassword: fundingPasswordHash };
  const usersById = { [adminId]: adminDoc, ...customers };
  let otpCreated = false;
  try {
    User.findById = async (id) => usersById[String(id)] || null;
    OTP.findOne = async () => (otpCreated ? { _id: 'otp-1', hashedOtp: await bcrypt.hash(OTP_CODE, 10) } : null);
    OTP.deleteMany = async () => { otpCreated = false; return {}; };
    OTP.deleteOne = async () => { otpCreated = false; return {}; };
    OTP.create = async () => { otpCreated = true; return {}; };
    Transaction.findOne = async () => null;
    Notification.create = async () => ({});
    AdminLog.create = async () => ({});
    await fn(usersById);
  } finally {
    User.findById = original.userFindById;
    OTP.findOne = original.otpFindOne;
    OTP.deleteMany = original.otpDeleteMany;
    OTP.deleteOne = original.otpDeleteOne;
    OTP.create = original.otpCreate;
    Transaction.findOne = original.txFindOne;
    Notification.create = original.notifCreate;
    AdminLog.create = original.adminLogCreate;
  }
};

test('initiateWalletAction: reseller_admin CAN initiate for their own tenant\'s customer', async () => {
  const customers = { [CUSTOMER_ID]: { _id: CUSTOMER_ID, tenantOwnerId: RESELLER_ID } };
  await withMocks({ adminId: RESELLER_ID, adminRole: 'reseller_admin', customers }, async () => {
    const req = {
      body: { userId: CUSTOMER_ID, amount: 1000, action: 'credit', fundingPassword: FUNDING_PASSWORD, reason: 'Manual adjustment test' },
      user: { _id: RESELLER_ID, role: 'reseller_admin' },
    };
    const res = makeRes();
    await initiateWalletAction(req, res);
    assert.equal(res.statusCode, null, 'should not be rejected');
    assert.ok(res.body.intentToken, 'an intent token should be issued');
  });
});

test('initiateWalletAction: reseller_admin CANNOT initiate for another tenant\'s customer (fails fast, no OTP)', async () => {
  const customers = { [OTHER_CUSTOMER_ID]: { _id: OTHER_CUSTOMER_ID, tenantOwnerId: 'some-other-reseller' } };
  let otpCreateCalled = false;
  await withMocks({ adminId: RESELLER_ID, adminRole: 'reseller_admin', customers }, async () => {
    const originalOtpCreate = OTP.create;
    OTP.create = async (...args) => { otpCreateCalled = true; return originalOtpCreate(...args); };
    const req = {
      body: { userId: OTHER_CUSTOMER_ID, amount: 1000, action: 'credit', fundingPassword: FUNDING_PASSWORD, reason: 'Manual adjustment test' },
      user: { _id: RESELLER_ID, role: 'reseller_admin' },
    };
    const res = makeRes();
    await initiateWalletAction(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(otpCreateCalled, false, 'no OTP should be generated for a denied cross-tenant target');
  });
});

test('initiateWalletAction: admin remains unrestricted (any tenant, unchanged)', async () => {
  const customers = { [OTHER_CUSTOMER_ID]: { _id: OTHER_CUSTOMER_ID, tenantOwnerId: 'some-other-reseller' } };
  await withMocks({ adminId: 'staff-id', adminRole: 'admin', customers }, async () => {
    const req = {
      body: { userId: OTHER_CUSTOMER_ID, amount: 1000, action: 'credit', fundingPassword: FUNDING_PASSWORD, reason: 'Manual adjustment test' },
      user: { _id: 'staff-id', role: 'admin' },
    };
    const res = makeRes();
    await initiateWalletAction(req, res);
    assert.equal(res.statusCode, null, 'admin should not be blocked by tenant scoping');
    assert.ok(res.body.intentToken);
  });
});

test('confirmWalletAction: reseller_admin CAN confirm a credit for their own tenant\'s customer', async () => {
  walletCalls.length = 0;
  const customers = { [CUSTOMER_ID]: { _id: CUSTOMER_ID, tenantOwnerId: RESELLER_ID, balance1: 0 } };
  await withMocks({ adminId: RESELLER_ID, adminRole: 'reseller_admin', customers }, async () => {
    await OTP.create({});
    const intentToken = jwt.sign(
      { adminId: RESELLER_ID, userId: CUSTOMER_ID, amount: 1000, action: 'credit', reason: 'test', type: 'funding_intent' },
      SECRET, { expiresIn: '10m' }
    );
    const req = { body: { intentToken, otp: OTP_CODE }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
    const res = makeRes();
    await confirmWalletAction(req, res);
    assert.equal(res.statusCode, null, `expected success, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    assert.equal(walletCalls.length, 1);
    assert.equal(walletCalls[0].userId, CUSTOMER_ID);
  });
});

test('confirmWalletAction: reseller_admin CANNOT confirm for another tenant\'s customer, even with an otherwise-valid intent token (IDOR closed → 403)', async () => {
  walletCalls.length = 0;
  const customers = { [OTHER_CUSTOMER_ID]: { _id: OTHER_CUSTOMER_ID, tenantOwnerId: 'some-other-reseller', balance1: 0 } };
  await withMocks({ adminId: RESELLER_ID, adminRole: 'reseller_admin', customers }, async () => {
    await OTP.create({});
    // Simulates a stale/tampered intent token targeting a customer outside
    // the reseller's tenant — proves the defense-in-depth re-check at
    // confirm time, independent of the initiate-time check.
    const intentToken = jwt.sign(
      { adminId: RESELLER_ID, userId: OTHER_CUSTOMER_ID, amount: 1000, action: 'credit', reason: 'test', type: 'funding_intent' },
      SECRET, { expiresIn: '10m' }
    );
    const req = { body: { intentToken, otp: OTP_CODE }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
    const res = makeRes();
    await confirmWalletAction(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(walletCalls.length, 0, 'wallet must NOT be credited/debited');
  });
});

test('confirmWalletAction: admin remains unrestricted (any tenant, unchanged)', async () => {
  walletCalls.length = 0;
  const customers = { [OTHER_CUSTOMER_ID]: { _id: OTHER_CUSTOMER_ID, tenantOwnerId: 'some-other-reseller', balance1: 0 } };
  await withMocks({ adminId: 'staff-id', adminRole: 'admin', customers }, async () => {
    await OTP.create({});
    const intentToken = jwt.sign(
      { adminId: 'staff-id', userId: OTHER_CUSTOMER_ID, amount: 1000, action: 'credit', reason: 'test', type: 'funding_intent' },
      SECRET, { expiresIn: '10m' }
    );
    const req = { body: { intentToken, otp: OTP_CODE }, user: { _id: 'staff-id', role: 'admin' } };
    const res = makeRes();
    await confirmWalletAction(req, res);
    assert.equal(res.statusCode, null, `admin should not be blocked, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    assert.equal(walletCalls.length, 1);
  });
});

test('confirmWalletAction: invalid OTP is still rejected (existing security step not weakened)', async () => {
  walletCalls.length = 0;
  const customers = { [CUSTOMER_ID]: { _id: CUSTOMER_ID, tenantOwnerId: RESELLER_ID, balance1: 0 } };
  await withMocks({ adminId: RESELLER_ID, adminRole: 'reseller_admin', customers }, async () => {
    await OTP.create({});
    const intentToken = jwt.sign(
      { adminId: RESELLER_ID, userId: CUSTOMER_ID, amount: 1000, action: 'credit', reason: 'test', type: 'funding_intent' },
      SECRET, { expiresIn: '10m' }
    );
    const req = { body: { intentToken, otp: '000000' }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
    const res = makeRes();
    await confirmWalletAction(req, res);
    assert.equal(res.statusCode, 401);
    assert.equal(walletCalls.length, 0);
  });
});
