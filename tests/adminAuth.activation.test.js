// Unit test for the root-cause fix in middlewares/adminAuth.js:
// reseller_admin must have resellerActivationStatus === 'active' to use the
// Admin Portal. admin/superadmin are unaffected, and the separate trial
// dashboard middleware (middlewares/auth.js, used by /api/reseller/*) is
// proven to remain untouched/unaffected by this change.
//
// Runs standalone against Node's built-in test runner — no live DB or
// server required. Mongoose model static methods (User.findOne,
// Session.findOne) are monkey-patched per-test to return canned data.
//
// Run with: node --test tests/adminAuth.activation.test.js

import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

import { adminAuth } from '../middlewares/adminAuth.js';
import { auth } from '../middlewares/auth.js';
import User from '../models/User.js';
import Session from '../models/Session.js';

const SECRET = process.env.JWT_SECRET || 'mk_sub_data_secret_2024_premium';
const USER_ID = '507f1f77bcf86cd799439011';

const makeToken = () => jwt.sign({ id: USER_ID }, SECRET);

const makeReq = ({ token, host = 'reseller1.9jasub.com' }) => ({
  header: (name) => {
    if (name === 'Authorization') return `Bearer ${token}`;
    if (name === 'Host') return host;
    return undefined;
  },
  headers: { authorization: `Bearer ${token}` },
  query: {},
});

const makeRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

// Restores the real Mongoose static methods after each test so tests never
// leak mocks into one another (or into any other file's test run).
const withMocks = async ({ sessionValid = true, user }, fn) => {
  const originalSessionFindOne = Session.findOne;
  const originalUserFindOne = User.findOne;
  const originalUserFindById = User.findById;
  try {
    Session.findOne = async () => (sessionValid ? { token: 'x', isValid: true } : null);
    User.findOne = async (query) => {
      if (!user) return null;
      // adminAuth queries by { _id, role: { $in: [...] } } — reflect the
      // same role-allowlist behavior the real query does.
      if (query.role && !query.role.$in.includes(user.role)) return null;
      return user;
    };
    User.findById = async () => user;
    await fn();
  } finally {
    Session.findOne = originalSessionFindOne;
    User.findOne = originalUserFindOne;
    User.findById = originalUserFindById;
  }
};

test('adminAuth: reseller_admin + resellerActivationStatus=active → Admin Portal allowed', async () => {
  const token = makeToken();
  const user = {
    _id: USER_ID, email: 'active-reseller@example.com', role: 'reseller_admin',
    resellerActivationStatus: 'active', admin_subdomain: 'reseller1', isSuspended: false,
  };
  await withMocks({ user }, async () => {
    const req = makeReq({ token, host: 'reseller1.9jasub.com' });
    const res = makeRes();
    let nextCalled = false;
    await adminAuth(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true, 'next() should be called for an active reseller_admin');
    assert.equal(res.statusCode, null, 'no error status should be set');
    assert.equal(req.user.email, user.email);
  });
});

test('adminAuth: reseller_admin + resellerActivationStatus=pending_onboarding → Admin Portal denied (403)', async () => {
  const token = makeToken();
  const user = {
    _id: USER_ID, email: 'pending-reseller@example.com', role: 'reseller_admin',
    resellerActivationStatus: 'pending_onboarding', admin_subdomain: 'reseller1', isSuspended: false,
  };
  await withMocks({ user }, async () => {
    const req = makeReq({ token, host: 'reseller1.9jasub.com' });
    const res = makeRes();
    let nextCalled = false;
    await adminAuth(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false, 'next() must NOT be called for a pending_onboarding reseller_admin');
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /not yet activated/i);
  });
});

test('adminAuth: reseller_admin + resellerActivationStatus=suspended (inactive) → Admin Portal denied (403)', async () => {
  const token = makeToken();
  const user = {
    _id: USER_ID, email: 'suspended-reseller@example.com', role: 'reseller_admin',
    resellerActivationStatus: 'suspended', admin_subdomain: 'reseller1', isSuspended: false,
  };
  await withMocks({ user }, async () => {
    const req = makeReq({ token, host: 'reseller1.9jasub.com' });
    const res = makeRes();
    let nextCalled = false;
    await adminAuth(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false, 'next() must NOT be called for an inactive (suspended) reseller_admin');
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /not yet activated/i);
  });
});

test('auth (trial dashboard middleware): non-activated reseller_admin is still allowed through — /api/reseller/* is unaffected', async () => {
  const token = makeToken();
  // Same non-activated user as the "denied" adminAuth cases above, proving
  // the denial is specific to the Admin Portal (adminAuth), not a global
  // change to reseller_admin auth — the trial dashboard uses this separate
  // middleware (middlewares/auth.js) and never checks resellerActivationStatus.
  const user = {
    _id: USER_ID, email: 'trial-reseller@example.com', role: 'reseller_admin',
    resellerActivationStatus: 'pending_onboarding', isSuspended: false,
  };
  await withMocks({ user }, async () => {
    const req = makeReq({ token });
    const res = makeRes();
    let nextCalled = false;
    await auth(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true, 'auth middleware must still allow a trial reseller_admin through');
    assert.equal(res.statusCode, null);
  });
});

for (const role of ['admin', 'superadmin']) {
  test(`adminAuth: ${role} remains unaffected regardless of resellerActivationStatus`, async () => {
    const token = makeToken();
    const user = {
      _id: USER_ID, email: `${role}@example.com`, role,
      resellerActivationStatus: 'none', isSuspended: false,
    };
    await withMocks({ user }, async () => {
      // Deliberately no/mismatched Host header — the subdomain check only
      // applies to the reseller_admin branch, so this must not matter here.
      const req = makeReq({ token, host: 'unrelated-host.example.com' });
      const res = makeRes();
      let nextCalled = false;
      await adminAuth(req, res, () => { nextCalled = true; });
      assert.equal(nextCalled, true, `next() should be called for ${role}`);
      assert.equal(res.statusCode, null);
      assert.equal(req.user.role, role);
    });
  });
}

test('adminAuth: unrelated behavior unchanged — missing token still 401, unknown role still 403', async () => {
  // No token at all
  {
    const req = makeReq({ token: '' });
    req.header = (name) => (name === 'Authorization' ? undefined : undefined);
    const res = makeRes();
    let nextCalled = false;
    await adminAuth(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
  }

  // Valid token, but role not in the admin allowlist at all
  const token = makeToken();
  const user = { _id: USER_ID, email: 'plain-user@example.com', role: 'user', isSuspended: false };
  await withMocks({ user }, async () => {
    const req = makeReq({ token });
    const res = makeRes();
    let nextCalled = false;
    await adminAuth(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
  });
});
