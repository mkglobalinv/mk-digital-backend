// HTTP tests of /api/admin/integrations through the REAL admin router
// (adminAuth + requireSuperAdmin) with real JWTs and sessions on MongoDB.
import crypto from 'crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import nock from 'nock';

let MongoMemoryServer;
try { ({ MongoMemoryServer } = await import('mongodb-memory-server')); } catch { MongoMemoryServer = null; }
const describeDb = MongoMemoryServer ? describe : describe.skip;

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SETTINGS_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
delete process.env.FLW_SECRET_KEY;
delete process.env.FLW_WEBHOOK_HASH;

const { default: adminRoutes } = await import('../../routes/adminRoutes.js');
const { default: User } = await import('../../models/User.js');
const { default: Session } = await import('../../models/Session.js');
const { default: IntegrationCredential } = await import('../../models/IntegrationCredential.js');
const { __setConnectionTests } = await import('../../services/settings/connectionTests.js');
const { OWNER_EMAIL } = await import('../../middlewares/requireOwner.js');

const SECRET = 'FLWSECK-live-abcdefghijklmnop-ZZ99';

describeDb('/api/admin/integrations', () => {
    let mongod, server, base;
    const tokens = {};

    const call = (method, path, { as, body, host } = {}) => fetch(`${base}/api/admin/integrations${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(as ? { Authorization: `Bearer ${tokens[as]}` } : {}),
            ...(host ? { 'X-Test-Host': host } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    }).then(async (r) => ({ status: r.status, text: await r.text(), headers: r.headers }));

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri());
        const make = async (name, fields) => {
            const u = await User.create({ name, email: `${name}@example.com`, password: 'x', ...fields });
            const token = jwt.sign({ id: u._id }, process.env.JWT_SECRET);
            await Session.create({ userId: u._id, token, isValid: true });
            tokens[name] = token;
            return u;
        };
        await make('superadmin', { role: 'superadmin' });
        const owner = await User.create({ name: 'owner', email: OWNER_EMAIL, password: 'x', role: 'admin' });
        tokens.owner = jwt.sign({ id: owner._id }, process.env.JWT_SECRET);
        await Session.create({ userId: owner._id, token: tokens.owner, isValid: true });
        await make('admin', { role: 'admin' });
        // A fully activated reseller on its own admin portal passes adminAuth;
        // the super-admin gate must still refuse it.
        await make('reseller', { role: 'reseller_admin', resellerActivationStatus: 'active', admin_subdomain: 'shopadmin' });
        await make('merchant', { role: 'merchant' });
        await make('customer', { role: 'user' });
        await make('suspendedsuper', { role: 'superadmin', isSuspended: true });

        const app = express();
        app.use(express.json());
        // Simulate the reseller's admin-portal Host (fetch cannot override Host).
        app.use((req, _res, next) => { if (req.headers['x-test-host']) req.headers.host = req.headers['x-test-host']; next(); });
        app.use('/api/admin', adminRoutes);
        server = app.listen(0, '127.0.0.1');
        await new Promise((r) => server.once('listening', r));
        base = `http://127.0.0.1:${server.address().port}`;
        nock.disableNetConnect();
        nock.enableNetConnect('127.0.0.1');
    }, 120000);

    afterAll(async () => {
        nock.enableNetConnect();
        server?.close();
        await mongoose.disconnect();
        await mongod?.stop();
    });

    test('only super admins and the owner get in', async () => {
        expect((await call('GET', '/', { as: 'superadmin' })).status).toBe(200);
        expect((await call('GET', '/', { as: 'owner' })).status).toBe(200);
        expect((await call('GET', '/', { as: 'admin' })).status).toBe(403);
        expect((await call('GET', '/', { as: 'reseller', host: 'shopadmin.9jasub.com' })).status).toBe(403);
        expect((await call('GET', '/', { as: 'merchant' })).status).toBe(403);
        expect((await call('GET', '/', { as: 'customer' })).status).toBe(403);
        expect((await call('GET', '/', { as: 'suspendedsuper' })).status).toBe(403);
        expect((await call('GET', '/')).status).toBe(401);
        expect((await call('GET', '/', { as: 'superadmin' })).headers.get('cache-control')).toBe('no-store');
    });

    test('every endpoint is protected, including writes and tests', async () => {
        for (const [method, path, body] of [['PUT', '/', { changes: { FLW_SECRET_KEY: SECRET } }], ['POST', '/providers/flutterwave/test'], ['POST', '/providers/peyflex/enabled', { enabled: false }], ['GET', '/audit']]) {
            expect((await call(method, path, { as: 'admin', body })).status).toBe(403);
            expect((await call(method, path, { as: 'reseller', host: 'shopadmin.9jasub.com', body })).status).toBe(403);
            expect((await call(method, path, { body })).status).toBe(401);
        }
        expect(await IntegrationCredential.countDocuments({})).toBe(0);
    });

    test('save via HTTP: encrypted in DB, masked in every response, never echoed', async () => {
        const save = await call('PUT', '/', { as: 'owner', body: { changes: { FLW_SECRET_KEY: SECRET, FLW_WEBHOOK_HASH: 'hash-value-0001' } } });
        expect(save.status).toBe(200);
        expect(save.text).not.toContain(SECRET);
        expect(save.text).not.toContain('hash-value-0001');
        expect(save.text).toContain('••••••••ZZ99');

        const get = await call('GET', '/', { as: 'superadmin' });
        expect(get.text).not.toContain(SECRET);
        const audit = await call('GET', '/audit', { as: 'superadmin' });
        expect(audit.text).toContain(OWNER_EMAIL);
        expect(audit.text).not.toContain(SECRET);

        const raw = JSON.stringify(await mongoose.connection.collection('integrationcredentials').find().toArray());
        expect(raw).not.toContain(SECRET);
    });

    test('validation errors are 400 with the field, and do not echo the input', async () => {
        const r = await call('PUT', '/', { as: 'superadmin', body: { changes: { SUPABASE_URL: 'http://bad-url-SECRETISH' } } });
        expect(r.status).toBe(400);
        expect(JSON.parse(r.text)).toMatchObject({ field: 'SUPABASE_URL' });
        expect(r.text).not.toContain('SECRETISH');
    });

    test('Test Connection: real Flutterwave check against a mocked API; failure message has no secret', async () => {
        nock('https://api.flutterwave.com').get('/v3/balances').matchHeader('authorization', `Bearer ${SECRET}`).reply(200, { status: 'success' });
        let r = await call('POST', '/providers/flutterwave/test', { as: 'superadmin' });
        expect(JSON.parse(r.text)).toMatchObject({ ok: true, message: 'Connected.', lastTest: { status: 'connected' } });

        nock('https://api.flutterwave.com').get('/v3/balances').reply(401, { message: `invalid key ${SECRET}` });
        r = await call('POST', '/providers/flutterwave/test', { as: 'superadmin' });
        expect(JSON.parse(r.text)).toMatchObject({ ok: false, message: 'Rejected credentials (HTTP 401).' });
        expect(r.text).not.toContain(SECRET);

        // A provider test that leaks the key in its error is redacted before it is returned or stored.
        __setConnectionTests({ flutterwave: async () => { throw new Error(`boom ${SECRET}`); } });
        r = await call('POST', '/providers/flutterwave/test', { as: 'superadmin' });
        expect(r.text).toContain('[redacted]');
        expect(r.text).not.toContain(SECRET);
        const view = await call('GET', '/', { as: 'superadmin' });
        expect(view.text).not.toContain(SECRET);
        __setConnectionTests({});

        expect((await call('POST', '/providers/analytics/test', { as: 'superadmin' })).status).toBe(400);
    });

    test('connection tests are rate limited per admin', async () => {
        __setConnectionTests({ paystack: async () => ({ ok: true, message: 'ok' }) });
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_ratelimit_0000';
        const statuses = [];
        for (let i = 0; i < 12; i++) statuses.push((await call('POST', '/providers/paystack/test', { as: 'owner' })).status);
        expect(statuses.filter((s) => s === 400).length).toBeGreaterThan(0);
        __setConnectionTests({});
    });

    test('enable/disable via HTTP', async () => {
        const r = await call('POST', '/providers/peyflex/enabled', { as: 'superadmin', body: { enabled: false } });
        expect(r.status).toBe(200);
        expect(JSON.parse(r.text).view.providers.find((p) => p.id === 'peyflex').enabled).toBe(false);
        expect((await call('POST', '/providers/flutterwave/enabled', { as: 'superadmin', body: { enabled: false } })).status).toBe(400);
    });

    test('the pre-existing /api/admin/system-settings route is not shadowed', async () => {
        const r = await fetch(`${base}/api/admin/system-settings`, { headers: { Authorization: `Bearer ${tokens.owner}` } });
        expect(r.status).not.toBe(404);
        expect(await r.text()).not.toContain('"providers"');
    });
});
