// Regression test for restoring controllers/resellerController.js:
// registerResellerWithPayment (POST /api/reseller/register-with-payment) —
// this endpoint was returning an unconditional 503 ("temporarily
// unavailable while we complete a security review") as an emergency
// containment measure (commit db85078), because it granted role:
// "reseller_admin" without any payment verification.
//
// That containment is now removed because the actual risk it was guarding
// against — an unpaid/unactivated reseller_admin getting Admin Portal
// access — is closed at the root by middlewares/adminAuth.js requiring
// resellerActivationStatus === 'active' (see tests/adminAuth.activation.test.js).
// This endpoint creates accounts with resellerActivationStatus:
// 'pending_onboarding', not 'active', so a freshly registered account is
// still denied Admin Portal access; it only gets the self-service trial
// dashboard (/api/reseller/*), which was never gated by adminAuth in the
// first place.
//
// This suite proves:
//   - The endpoint no longer short-circuits with a 503 — the original
//     logic (left untouched below the removed containment block) runs.
//   - New accounts are created with resellerActivationStatus:
//     'pending_onboarding' and role: 'reseller_admin' — i.e. the exact
//     safety invariant this restoration decision depends on.
//
// Runs standalone — no live DB. User's Mongoose static/prototype methods
// (findOne, collection.indexes, prototype.save) are monkey-patched.
//
// Run with: node --test-force-exit --test tests/registerResellerWithPayment.restored.test.js

import test from 'node:test';
import assert from 'node:assert/strict';

import { registerResellerWithPayment } from '../controllers/resellerController.js';
import User from '../models/User.js';

const makeRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

test('registerResellerWithPayment: no longer returns 503 (containment removed)', async () => {
  const original = {
    findOne: User.findOne,
    collectionIndexes: User.collection?.indexes,
    save: User.prototype.save,
  };
  let savedDoc = null;
  try {
    User.findOne = async () => null; // no existing user, subdomain available
    if (!User.collection) User.collection = {};
    User.collection.indexes = async () => [];
    User.prototype.save = async function () { savedDoc = this; return this; };

    const req = {
      body: {
        name: 'Test Owner',
        email: 'newreseller@example.com',
        phone: '08012345678',
        businessName: 'Test VTU Store',
        state: 'Lagos',
        password: 'StrongPass123!',
        enabledFuturePlatforms: [],
      },
    };
    const res = makeRes();
    await registerResellerWithPayment(req, res);

    assert.notEqual(res.statusCode, 503, 'the emergency-containment 503 must be gone');
    assert.equal(res.statusCode, 201, `expected successful registration, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.message, 'Reseller account created successfully');
  } finally {
    User.findOne = original.findOne;
    if (User.collection) User.collection.indexes = original.collectionIndexes;
    User.prototype.save = original.save;
  }
});

test('registerResellerWithPayment: new accounts are pending_onboarding, not active (Admin Portal stays gated)', async () => {
  const original = {
    findOne: User.findOne,
    collectionIndexes: User.collection?.indexes,
    save: User.prototype.save,
  };
  let savedDoc = null;
  try {
    User.findOne = async () => null;
    if (!User.collection) User.collection = {};
    User.collection.indexes = async () => [];
    User.prototype.save = async function () { savedDoc = this; return this; };

    const req = {
      body: {
        name: 'Another Owner',
        email: 'another@example.com',
        phone: '08099999999',
        businessName: 'Another Store',
        state: 'Abuja',
        password: 'StrongPass123!',
        enabledFuturePlatforms: [],
      },
    };
    const res = makeRes();
    await registerResellerWithPayment(req, res);

    assert.ok(savedDoc, 'a user document should have been saved');
    assert.equal(savedDoc.role, 'reseller_admin');
    assert.equal(savedDoc.resellerActivationStatus, 'pending_onboarding', 'must NOT be active — Admin Portal must stay gated until real activation');
  } finally {
    User.findOne = original.findOne;
    if (User.collection) User.collection.indexes = original.collectionIndexes;
    User.prototype.save = original.save;
  }
});
