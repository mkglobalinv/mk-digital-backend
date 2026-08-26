// Unit tests for controllers/auditController.js:getResellerAnalyticsOverview
// (Phase 1 Reseller Website Analytics). Verifies:
//   - Correct tenant attribution: each reseller's row only carries ITS OWN
//     aggregated customer/transaction numbers, never another reseller's.
//   - The customer aggregation is scoped to tenantOwnerId $in [resellers'
//     own ids] -- main-platform users (tenantOwnerId: null) are structurally
//     excluded by construction, not by a runtime filter that could be wrong.
//   - A reseller with zero matching aggregate rows (no customers/transactions
//     yet) safely defaults to zeros rather than crashing.
//   - Exactly 3 DB calls total regardless of reseller count (1 User.find +
//     1 User.aggregate + 1 Transaction.aggregate) -- proves no N+1 loop.
//   - Status wording is "Active"/"Inactive", never "online"/"offline".
//
// Runs standalone — no live DB. User/Transaction static methods are
// monkey-patched directly on the imported model classes.
//
// Run with: node --experimental-test-module-mocks --test-force-exit --test tests/resellerAnalytics.test.js

import test from 'node:test';
import assert from 'node:assert/strict';

import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const { getResellerAnalyticsOverview } = await import('../controllers/auditController.js');

const RESELLER_A = '507f1f77bcf86cd799439011';
const RESELLER_B = '507f1f77bcf86cd799439022';

const makeRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

const withMocks = async ({ resellers, customerAgg, txAgg }, fn) => {
  const calls = { userFind: 0, userAggregate: 0, txAggregate: 0 };
  const original = {
    userFind: User.find,
    userAggregate: User.aggregate,
    txAggregate: Transaction.aggregate,
  };

  // Mimics Mongoose's chainable find(...).select(...).lean() returning a Promise.
  User.find = () => { calls.userFind++; return { select: () => ({ lean: async () => resellers }) }; };

  User.aggregate = async (pipeline) => {
    calls.userAggregate++;
    // Capture the $match stage so the test can assert tenant scoping.
    withMocks.lastUserMatch = pipeline[0].$match;
    return customerAgg;
  };

  Transaction.aggregate = async (pipeline) => {
    calls.txAggregate++;
    withMocks.lastTxMatch = pipeline[0].$match;
    return txAgg;
  };

  try {
    await fn(calls);
  } finally {
    User.find = original.userFind;
    User.aggregate = original.userAggregate;
    Transaction.aggregate = original.txAggregate;
  }
};

test('getResellerAnalyticsOverview: two resellers get only their own numbers (no cross-tenant leakage)', async () => {
  const resellers = [
    { _id: RESELLER_A, name: 'Reseller A', branding: { siteName: 'A Store' }, subdomain: 'a-store', customDomain: null, whiteLabelStatus: 'active', isResellerActivated: true, isGracePeriod: false, resellerTier: 'basic', createdAt: new Date('2025-01-01') },
    { _id: RESELLER_B, name: 'Reseller B', branding: { siteName: 'B Store' }, subdomain: 'b-store', customDomain: null, whiteLabelStatus: 'active', isResellerActivated: true, isGracePeriod: false, resellerTier: 'premium', createdAt: new Date('2025-02-01') },
  ];
  const customerAgg = [
    { _id: RESELLER_A, totalCustomers: 10, customersToday: 1, customersWeek: 3, customersMonth: 5 },
    { _id: RESELLER_B, totalCustomers: 40, customersToday: 2, customersWeek: 9, customersMonth: 15 },
  ];
  const txAgg = [
    { _id: RESELLER_A, txToday: 2, txWeek: 5, txMonth: 12, volumeToday: 2000, volumeWeek: 5000, volumeMonth: 12000, lastActivity: new Date() },
    { _id: RESELLER_B, txToday: 8, txWeek: 20, txMonth: 60, volumeToday: 80000, volumeWeek: 200000, volumeMonth: 600000, lastActivity: new Date() },
  ];

  await withMocks({ resellers, customerAgg, txAgg }, async (calls) => {
    const res = makeRes();
    await getResellerAnalyticsOverview({}, res);

    assert.equal(res.statusCode, null); // res.json() called directly, no explicit status = 200 default
    const rows = res.body.resellers;
    assert.equal(rows.length, 2);

    const a = rows.find(r => String(r.resellerId) === RESELLER_A);
    const b = rows.find(r => String(r.resellerId) === RESELLER_B);

    // Reseller A must carry ONLY reseller A's numbers.
    assert.equal(a.customers.total, 10);
    assert.equal(a.transactions.month, 12);
    assert.equal(a.volume.month, 12000);

    // Reseller B must carry ONLY reseller B's numbers -- never A's.
    assert.equal(b.customers.total, 40);
    assert.equal(b.transactions.month, 60);
    assert.equal(b.volume.month, 600000);

    // Cross-check: neither reseller's numbers equal the other's (would catch
    // an accidental shared-reference or off-by-one key bug).
    assert.notEqual(a.customers.total, b.customers.total);
    assert.notEqual(a.volume.month, b.volume.month);

    // Exactly 3 DB round-trips total, not one per reseller (no N+1).
    assert.equal(calls.userFind, 1);
    assert.equal(calls.userAggregate, 1);
    assert.equal(calls.txAggregate, 1);

    // Tenant scoping: the customer aggregation is explicitly matched to the
    // resellers' own ids -- structurally excludes main-platform users
    // (tenantOwnerId: null) since null is never in this $in list.
    assert.deepEqual(withMocks.lastUserMatch.tenantOwnerId.$in, [RESELLER_A, RESELLER_B]);
    assert.ok(!withMocks.lastUserMatch.tenantOwnerId.$in.includes(null));

    // Status wording is business-status based, never "online"/"offline".
    assert.ok(['Active', 'Inactive'].includes(a.status));
    assert.ok(['Active', 'Inactive'].includes(b.status));
  });
});

test('getResellerAnalyticsOverview: reseller with no customers/transactions yet defaults to zero, not a crash', async () => {
  const resellers = [
    { _id: RESELLER_A, name: 'New Reseller', branding: {}, subdomain: 'new-store', customDomain: null, whiteLabelStatus: 'pending', isResellerActivated: false, isGracePeriod: false, resellerTier: 'basic', createdAt: new Date() },
  ];

  await withMocks({ resellers, customerAgg: [], txAgg: [] }, async () => {
    const res = makeRes();
    await getResellerAnalyticsOverview({}, res);

    const row = res.body.resellers[0];
    assert.equal(row.customers.total, 0);
    assert.equal(row.transactions.month, 0);
    assert.equal(row.volume.month, 0);
    assert.equal(row.lastActivity, null);
    assert.equal(row.status, 'Inactive');
    assert.equal(row.statusReason, 'Not yet activated');
  });
});

test('getResellerAnalyticsOverview: suspended reseller is reported Inactive with the real reason, not a fabricated "offline"', async () => {
  const resellers = [
    { _id: RESELLER_A, name: 'Suspended Reseller', branding: {}, subdomain: 'susp', customDomain: null, whiteLabelStatus: 'suspended', isResellerActivated: true, isGracePeriod: false, resellerTier: 'basic', createdAt: new Date() },
  ];

  await withMocks({ resellers, customerAgg: [], txAgg: [] }, async () => {
    const res = makeRes();
    await getResellerAnalyticsOverview({}, res);

    const row = res.body.resellers[0];
    assert.equal(row.status, 'Inactive');
    assert.equal(row.statusReason, 'Suspended');
  });
});

test('getResellerAnalyticsOverview: no resellers at all short-circuits cleanly without touching aggregate queries', async () => {
  await withMocks({ resellers: [], customerAgg: [], txAgg: [] }, async (calls) => {
    const res = makeRes();
    await getResellerAnalyticsOverview({}, res);
    assert.deepEqual(res.body.resellers, []);
    assert.equal(calls.userAggregate, 0);
    assert.equal(calls.txAggregate, 0);
  });
});
