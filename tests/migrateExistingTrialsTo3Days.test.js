// Regression test for the startup migration in controllers/adminController.js:
// migrateExistingTrialsTo3Days — retroactively shortens trialEndDate for
// accounts already mid-trial when the free trial policy changed from 7
// days to 3 (commit b983e61 only changed the calculation for NEW
// registrations; existing accounts kept whatever trialEndDate was already
// stored). This suite proves:
//   - An in-trial account's trialEndDate is recomputed to
//     trialStartDate + 3 days when that's earlier than what's stored.
//   - createdAt is used as the anchor when trialStartDate isn't set
//     (registerResellerWithPayment's main path never set it).
//   - The migration only ever shortens — an account whose stored
//     trialEndDate is already <= the 3-day value is left untouched.
//   - Only accounts still genuinely in trial (role reseller_admin,
//     isResellerActivated: false, resellerActivationStatus:
//     'pending_onboarding') are touched — an activated/suspended/plain
//     user account is never modified.
//
// Runs standalone — no live DB. User's Mongoose static methods (find,
// updateOne) are monkey-patched.
//
// Run with: node --test-force-exit --test tests/migrateExistingTrialsTo3Days.test.js

import test from 'node:test';
import assert from 'node:assert/strict';

import { migrateExistingTrialsTo3Days } from '../controllers/adminController.js';
import User from '../models/User.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const withMocks = async (users, fn) => {
  const original = { find: User.find, updateOne: User.updateOne };
  const updateCalls = [];
  try {
    User.find = (query) => ({
      select: async () => users.filter((u) => {
        if (query.role && u.role !== query.role) return false;
        if (query.isResellerActivated !== undefined && u.isResellerActivated !== query.isResellerActivated) return false;
        if (query.resellerActivationStatus && u.resellerActivationStatus !== query.resellerActivationStatus) return false;
        if (query.trialEndDate && (u.trialEndDate === undefined || u.trialEndDate === null)) return false;
        return true;
      }),
    });
    User.updateOne = async (filter, update) => {
      updateCalls.push({ id: filter._id, newTrialEndDate: update.$set.trialEndDate });
      return { modifiedCount: 1 };
    };
    await fn(updateCalls);
  } finally {
    User.find = original.find;
    User.updateOne = original.updateOne;
  }
};

test('migrateExistingTrialsTo3Days: shortens trialEndDate to trialStartDate + 3 days when currently later', async () => {
  const now = Date.now();
  const users = [{
    _id: 'user-1', role: 'reseller_admin', isResellerActivated: false, resellerActivationStatus: 'pending_onboarding',
    trialStartDate: new Date(now - 1 * DAY_MS), // started 1 day ago
    trialEndDate: new Date(now - 1 * DAY_MS + 7 * DAY_MS), // old 7-day value: 6 days left
  }];
  await withMocks(users, async (updateCalls) => {
    const count = await migrateExistingTrialsTo3Days();
    assert.equal(count, 1);
    assert.equal(updateCalls.length, 1);
    assert.equal(updateCalls[0].id, 'user-1');
    const expected = new Date(users[0].trialStartDate.getTime() + 3 * DAY_MS);
    assert.equal(updateCalls[0].newTrialEndDate.getTime(), expected.getTime());
  });
});

test('migrateExistingTrialsTo3Days: uses createdAt as the anchor when trialStartDate is missing', async () => {
  const now = Date.now();
  const users = [{
    _id: 'user-2', role: 'reseller_admin', isResellerActivated: false, resellerActivationStatus: 'pending_onboarding',
    trialStartDate: undefined,
    createdAt: new Date(now - 2 * DAY_MS),
    trialEndDate: new Date(now - 2 * DAY_MS + 7 * DAY_MS),
  }];
  await withMocks(users, async (updateCalls) => {
    const count = await migrateExistingTrialsTo3Days();
    assert.equal(count, 1);
    const expected = new Date(users[0].createdAt.getTime() + 3 * DAY_MS);
    assert.equal(updateCalls[0].newTrialEndDate.getTime(), expected.getTime());
  });
});

test('migrateExistingTrialsTo3Days: never extends — leaves an already-<=3-day trial untouched', async () => {
  const now = Date.now();
  const users = [{
    _id: 'user-3', role: 'reseller_admin', isResellerActivated: false, resellerActivationStatus: 'pending_onboarding',
    trialStartDate: new Date(now - 1 * DAY_MS),
    trialEndDate: new Date(now - 1 * DAY_MS + 2 * DAY_MS), // already shorter than 3 days from start
  }];
  await withMocks(users, async (updateCalls) => {
    const count = await migrateExistingTrialsTo3Days();
    assert.equal(count, 0, 'must not touch an account whose trial is already <= 3 days from start');
    assert.equal(updateCalls.length, 0);
  });
});

test('migrateExistingTrialsTo3Days: only touches accounts still genuinely in trial', async () => {
  const now = Date.now();
  const users = [
    { _id: 'activated', role: 'reseller_admin', isResellerActivated: true, resellerActivationStatus: 'active', trialStartDate: new Date(now - 1 * DAY_MS), trialEndDate: new Date(now + 5 * DAY_MS) },
    { _id: 'plain-user', role: 'user', isResellerActivated: false, resellerActivationStatus: 'pending_onboarding', trialStartDate: new Date(now - 1 * DAY_MS), trialEndDate: new Date(now + 5 * DAY_MS) },
    { _id: 'suspended', role: 'reseller_admin', isResellerActivated: false, resellerActivationStatus: 'suspended', trialStartDate: new Date(now - 1 * DAY_MS), trialEndDate: new Date(now + 5 * DAY_MS) },
    { _id: 'genuinely-in-trial', role: 'reseller_admin', isResellerActivated: false, resellerActivationStatus: 'pending_onboarding', trialStartDate: new Date(now - 1 * DAY_MS), trialEndDate: new Date(now + 5 * DAY_MS) },
  ];
  await withMocks(users, async (updateCalls) => {
    const count = await migrateExistingTrialsTo3Days();
    assert.equal(count, 1);
    assert.equal(updateCalls[0].id, 'genuinely-in-trial');
  });
});
