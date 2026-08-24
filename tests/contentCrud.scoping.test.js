// Unit tests for the content-CRUD tenant-scoping fix in
// controllers/contentController.js: createContent/updateContent/deleteContent
// are reachable by reseller_admin (via adminAuth, now gated on activation
// status) as well as admin/superadmin. Previously a reseller_admin could
// create forceGlobal/admin-owned content and edit or delete *any* content
// record system-wide (IDOR). This suite proves:
//   - reseller_admin creations are forced to their own tenant, never global.
//   - reseller_admin can update/delete their OWN content.
//   - reseller_admin CANNOT update/delete another tenant's (or admin's)
//     content.
//   - admin/superadmin behavior is unchanged.
//
// Runs standalone — no live DB. Content's Mongoose static methods and
// Document.prototype.save are monkey-patched per-test.
//
// Run with: node --test tests/contentCrud.scoping.test.js

import test from 'node:test';
import assert from 'node:assert/strict';

import { createContent, updateContent, deleteContent } from '../controllers/contentController.js';
import Content from '../models/Content.js';

const RESELLER_ID = '507f1f77bcf86cd799439011';
const OTHER_RESELLER_ID = '507f1f77bcf86cd799439099';
const CONTENT_ID = '607f1f77bcf86cd799439022';

const makeRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

const withContentMocks = async ({ updateManyResult, findOneAndUpdateResult, findOneAndDeleteResult, saveSpy }, fn) => {
  const original = {
    updateMany: Content.updateMany,
    findOneAndUpdate: Content.findOneAndUpdate,
    findOneAndDelete: Content.findOneAndDelete,
    save: Content.prototype.save,
  };
  try {
    Content.updateMany = async () => (updateManyResult ?? { acknowledged: true });
    Content.findOneAndUpdate = async (filter, updates) => {
      withContentMocks.lastUpdateFilter = filter;
      withContentMocks.lastUpdateBody = updates;
      return typeof findOneAndUpdateResult === 'function' ? findOneAndUpdateResult(filter) : findOneAndUpdateResult;
    };
    Content.findOneAndDelete = async (filter) => {
      withContentMocks.lastDeleteFilter = filter;
      return typeof findOneAndDeleteResult === 'function' ? findOneAndDeleteResult(filter) : findOneAndDeleteResult;
    };
    Content.prototype.save = async function () {
      if (saveSpy) saveSpy(this);
      return this;
    };
    await fn();
  } finally {
    Content.updateMany = original.updateMany;
    Content.findOneAndUpdate = original.findOneAndUpdate;
    Content.findOneAndDelete = original.findOneAndDelete;
    Content.prototype.save = original.save;
  }
};

test('createContent: reseller_admin creation is forced to their own tenant, never global/admin', async () => {
  let saved = null;
  await withContentMocks({ saveSpy: (doc) => { saved = doc; } }, async () => {
    const req = {
      user: { _id: RESELLER_ID, id: RESELLER_ID, role: 'reseller_admin', email: 'reseller@example.com' },
      body: {
        type: 'banner', title: 'My Banner',
        // Attacker-controlled attempt to escalate to admin/global content:
        ownerType: 'admin', forceGlobal: true,
      },
    };
    const res = makeRes();
    await createContent(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(saved.ownerType, 'reseller', 'reseller_admin content must be ownerType=reseller, ignoring body');
    assert.equal(String(saved.resellerId), RESELLER_ID, 'resellerId must be forced to the caller');
    assert.equal(saved.forceGlobal, false, 'forceGlobal must be forced to false for reseller_admin, ignoring body');
  });
});

test('createContent: admin behavior is unchanged (ownerType=admin, forceGlobal from body honored)', async () => {
  let saved = null;
  await withContentMocks({ saveSpy: (doc) => { saved = doc; } }, async () => {
    const req = {
      user: { _id: 'admin-id', id: 'admin-id', role: 'admin', email: 'admin@example.com' },
      body: { type: 'banner', title: 'Global Banner', forceGlobal: true },
    };
    const res = makeRes();
    await createContent(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(saved.ownerType, 'admin');
    assert.equal(saved.forceGlobal, true);
    assert.equal(saved.resellerId, undefined);
  });
});

test('updateContent: reseller_admin CAN update their own content, escalation fields stripped', async () => {
  await withContentMocks({
    findOneAndUpdateResult: (filter) => ({ _id: CONTENT_ID, title: 'Updated', ...filter }),
  }, async () => {
    const req = {
      params: { id: CONTENT_ID },
      user: { _id: RESELLER_ID, id: RESELLER_ID, role: 'reseller_admin', email: 'reseller@example.com' },
      body: { title: 'Updated', ownerType: 'admin', forceGlobal: true, resellerId: 'someone-else', type: 'marquee' },
    };
    const res = makeRes();
    await updateContent(req, res);
    assert.equal(res.statusCode, null, 'no error status — update should succeed');
    assert.equal(withContentMocks.lastUpdateFilter.resellerId, RESELLER_ID, 'query must be scoped to the caller\'s own tenant');
    assert.equal(withContentMocks.lastUpdateBody.ownerType, undefined, 'ownerType must be stripped from a reseller_admin update');
    assert.equal(withContentMocks.lastUpdateBody.forceGlobal, undefined, 'forceGlobal must be stripped');
    assert.equal(withContentMocks.lastUpdateBody.resellerId, undefined, 'resellerId reassignment must be stripped');
    assert.equal(withContentMocks.lastUpdateBody.type, undefined, 'marquee (admin-only type) must be stripped for reseller_admin');
  });
});

test('updateContent: reseller_admin CANNOT update another tenant\'s content (IDOR closed → 404)', async () => {
  await withContentMocks({ findOneAndUpdateResult: null }, async () => {
    const req = {
      params: { id: CONTENT_ID },
      user: { _id: OTHER_RESELLER_ID, id: OTHER_RESELLER_ID, role: 'reseller_admin', email: 'attacker@example.com' },
      body: { title: 'Hijacked' },
    };
    const res = makeRes();
    await updateContent(req, res);
    assert.equal(res.statusCode, 404, 'a content record scoped to a different reseller must not be found/updatable');
    assert.equal(withContentMocks.lastUpdateFilter.resellerId, OTHER_RESELLER_ID);
  });
});

test('updateContent: admin behavior is unchanged (unscoped by id, marquee logic intact)', async () => {
  await withContentMocks({
    findOneAndUpdateResult: (filter) => ({ _id: CONTENT_ID, ...filter }),
  }, async () => {
    const req = {
      params: { id: CONTENT_ID },
      user: { _id: 'admin-id', id: 'admin-id', role: 'admin', email: 'admin@example.com' },
      body: { title: 'Admin Update', type: 'marquee', is_active: true },
    };
    const res = makeRes();
    await updateContent(req, res);
    assert.equal(res.statusCode, null);
    assert.deepEqual(withContentMocks.lastUpdateFilter, { _id: CONTENT_ID }, 'admin update is not tenant-scoped');
    assert.equal(withContentMocks.lastUpdateBody.forceGlobal, true, 'marquee still forces forceGlobal for admin, unchanged');
  });
});

test('deleteContent: reseller_admin CAN delete their own content', async () => {
  await withContentMocks({ findOneAndDeleteResult: { _id: CONTENT_ID } }, async () => {
    const req = {
      params: { id: CONTENT_ID },
      user: { _id: RESELLER_ID, id: RESELLER_ID, role: 'reseller_admin', email: 'reseller@example.com' },
    };
    const res = makeRes();
    await deleteContent(req, res);
    assert.equal(res.statusCode, null);
    assert.equal(res.body.message, 'Content deleted successfully');
    assert.deepEqual(withContentMocks.lastDeleteFilter, { _id: CONTENT_ID, resellerId: RESELLER_ID });
  });
});

test('deleteContent: reseller_admin CANNOT delete another tenant\'s content (IDOR closed → 404)', async () => {
  await withContentMocks({ findOneAndDeleteResult: null }, async () => {
    const req = {
      params: { id: CONTENT_ID },
      user: { _id: OTHER_RESELLER_ID, id: OTHER_RESELLER_ID, role: 'reseller_admin', email: 'attacker@example.com' },
    };
    const res = makeRes();
    await deleteContent(req, res);
    assert.equal(res.statusCode, 404);
  });
});

test('deleteContent: admin behavior is unchanged (unscoped by id)', async () => {
  await withContentMocks({ findOneAndDeleteResult: { _id: CONTENT_ID } }, async () => {
    const req = {
      params: { id: CONTENT_ID },
      user: { _id: 'admin-id', id: 'admin-id', role: 'admin', email: 'admin@example.com' },
    };
    const res = makeRes();
    await deleteContent(req, res);
    assert.equal(res.statusCode, null);
    assert.deepEqual(withContentMocks.lastDeleteFilter, { _id: CONTENT_ID });
  });
});
