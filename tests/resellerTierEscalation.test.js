// Unit tests for the reseller tier/lifecycle self-escalation fix in
// controllers/adminController.js: updateResellerStatus, updateResellerTier,
// upgradeReseller, updateResellerFeatures, toggleResellerPricingPermission.
// Previously any activated reseller_admin (via adminAuth) could call these
// with resellerId/id set to their own account to grant themselves a
// premium/vip tier, pricing-override permission, or arbitrary features for
// free, or point it at another reseller's account with the same effect.
// Under the existing tenant model resellers have no ownership relationship
// over one another (peers, not sub-tenants of each other), so a
// reseller_admin has no legitimate target for any of these — neither
// themselves nor another reseller. This suite proves:
//   - reseller_admin CANNOT call any of the five endpoints, targeting
//     either themselves or another reseller.
//   - admin/superadmin remain unrestricted, unchanged.
//
// Runs standalone — no live DB. User/AdminLog static methods are
// monkey-patched. No module mocking needed (socketService's methods are all
// no-ops when no real Socket.IO server has been initialized, which is the
// case in this standalone test process).
//
// Run with: node --test-force-exit --test tests/resellerTierEscalation.test.js

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  updateResellerStatus, updateResellerTier, upgradeReseller,
  updateResellerFeatures, toggleResellerPricingPermission,
} from '../controllers/adminController.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';
import AppRequest from '../models/AppRequest.js';

const RESELLER_ID = '507f1f77bcf86cd799439011';
const OTHER_RESELLER_ID = '507f1f77bcf86cd799439099';

const makeRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

const withMocks = async ({ targetId, targetDoc }, fn) => {
  const original = {
    userFindById: User.findById, userFindByIdAndUpdate: User.findByIdAndUpdate,
    adminLogCreate: AdminLog.create, appRequestFindOne: AppRequest.findOne,
  };
  const doc = { _id: targetId, role: 'reseller_admin', resellerTier: 'basic', canOverridePricing: false, features: {}, ...targetDoc, save: async function () { return this; } };
  let updateCalled = false;
  try {
    User.findById = async (id) => (String(id) === String(targetId) ? doc : null);
    User.findByIdAndUpdate = async (id, update) => {
      if (String(id) !== String(targetId)) return null;
      updateCalled = true;
      Object.assign(doc, update);
      return doc;
    };
    AdminLog.create = async () => ({});
    // updateResellerFeatures/updateResellerSettings (admin path only, past
    // this suite's new authorization check) look up an in-flight app build
    // request to trigger a rebuild sync — not relevant to this fix, mocked
    // out to a no-op so the admin-path tests don't need a live DB.
    AppRequest.findOne = async () => null;
    await fn(doc, () => updateCalled);
  } finally {
    User.findById = original.userFindById;
    User.findByIdAndUpdate = original.userFindByIdAndUpdate;
    AdminLog.create = original.adminLogCreate;
    AppRequest.findOne = original.appRequestFindOne;
  }
};

// --- updateResellerStatus ---
for (const [label, targetId] of [['themselves', RESELLER_ID], ['another reseller', OTHER_RESELLER_ID]]) {
  test(`updateResellerStatus: reseller_admin CANNOT target ${label} (403)`, async () => {
    await withMocks({ targetId }, async (doc, wasUpdated) => {
      const req = { body: { resellerId: targetId, status: 'active' }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
      const res = makeRes();
      await updateResellerStatus(req, res);
      assert.equal(res.statusCode, 403);
      assert.equal(wasUpdated(), false);
    });
  });
}
test('updateResellerStatus: admin remains unrestricted', async () => {
  await withMocks({ targetId: OTHER_RESELLER_ID }, async (doc, wasUpdated) => {
    const req = { body: { resellerId: OTHER_RESELLER_ID, status: 'active' }, user: { _id: 'staff-id', role: 'admin' } };
    const res = makeRes();
    await updateResellerStatus(req, res);
    assert.equal(res.statusCode, null);
    assert.equal(wasUpdated(), true);
  });
});

// --- updateResellerTier (self-upgrade to premium/vip) ---
for (const [label, targetId] of [['themselves to premium', RESELLER_ID], ['another reseller', OTHER_RESELLER_ID]]) {
  test(`updateResellerTier: reseller_admin CANNOT upgrade ${label} (403)`, async () => {
    await withMocks({ targetId }, async (doc, wasUpdated) => {
      const req = { body: { resellerId: targetId, tier: 'premium' }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
      const res = makeRes();
      await updateResellerTier(req, res);
      assert.equal(res.statusCode, 403);
      assert.equal(wasUpdated(), false);
      assert.equal(doc.resellerTier, 'basic', 'tier must remain unchanged');
    });
  });
}
test('updateResellerTier: admin remains unrestricted', async () => {
  await withMocks({ targetId: OTHER_RESELLER_ID }, async (doc, wasUpdated) => {
    const req = { body: { resellerId: OTHER_RESELLER_ID, tier: 'premium' }, user: { _id: 'staff-id', role: 'admin' } };
    const res = makeRes();
    await updateResellerTier(req, res);
    assert.equal(res.statusCode, null);
    assert.equal(wasUpdated(), true);
  });
});

// --- upgradeReseller ---
for (const [label, targetId] of [['themselves', RESELLER_ID], ['another reseller', OTHER_RESELLER_ID]]) {
  test(`upgradeReseller: reseller_admin CANNOT upgrade ${label} (403)`, async () => {
    await withMocks({ targetId }, async (doc) => {
      const req = { params: { id: targetId }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
      const res = makeRes();
      await upgradeReseller(req, res);
      assert.equal(res.statusCode, 403);
      assert.equal(doc.canOverridePricing, false, 'must remain unchanged');
    });
  });
}
test('upgradeReseller: admin remains unrestricted', async () => {
  await withMocks({ targetId: OTHER_RESELLER_ID }, async (doc) => {
    const req = { params: { id: OTHER_RESELLER_ID }, user: { _id: 'staff-id', role: 'admin' } };
    const res = makeRes();
    await upgradeReseller(req, res);
    assert.equal(res.statusCode, null);
    assert.equal(doc.canOverridePricing, true);
  });
});

// --- updateResellerFeatures ---
for (const [label, targetId] of [['themselves', RESELLER_ID], ['another reseller', OTHER_RESELLER_ID]]) {
  test(`updateResellerFeatures: reseller_admin CANNOT grant features to ${label} (403)`, async () => {
    await withMocks({ targetId }, async (doc) => {
      const req = { params: { id: targetId }, body: { features: { apk_generation: true } }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
      const res = makeRes();
      await updateResellerFeatures(req, res);
      assert.equal(res.statusCode, 403);
      assert.equal(doc.features.apk_generation, undefined);
    });
  });
}
test('updateResellerFeatures: admin remains unrestricted', async () => {
  await withMocks({ targetId: OTHER_RESELLER_ID }, async (doc) => {
    const req = { params: { id: OTHER_RESELLER_ID }, body: { features: { apk_generation: true } }, user: { _id: 'staff-id', role: 'admin' } };
    const res = makeRes();
    await updateResellerFeatures(req, res);
    assert.equal(res.statusCode, null);
    assert.equal(doc.features.apk_generation, true);
  });
});

// --- toggleResellerPricingPermission ---
for (const [label, targetId] of [['themselves', RESELLER_ID], ['another reseller', OTHER_RESELLER_ID]]) {
  test(`toggleResellerPricingPermission: reseller_admin CANNOT grant pricing override to ${label} (403)`, async () => {
    await withMocks({ targetId }, async (doc, wasUpdated) => {
      const req = { params: { id: targetId }, body: { canOverridePricing: true }, user: { _id: RESELLER_ID, role: 'reseller_admin' } };
      const res = makeRes();
      await toggleResellerPricingPermission(req, res);
      assert.equal(res.statusCode, 403);
      assert.equal(wasUpdated(), false);
    });
  });
}
test('toggleResellerPricingPermission: admin remains unrestricted', async () => {
  await withMocks({ targetId: OTHER_RESELLER_ID }, async (doc, wasUpdated) => {
    const req = { params: { id: OTHER_RESELLER_ID }, body: { canOverridePricing: true }, user: { _id: 'staff-id', role: 'admin' } };
    const res = makeRes();
    await toggleResellerPricingPermission(req, res);
    assert.equal(res.statusCode, null);
    assert.equal(wasUpdated(), true);
  });
});
