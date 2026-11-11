// Domain lifecycle against a real MongoDB (mongodb-memory-server). nginx,
// certbot, DNS and network probes are replaced with controllable fakes; the
// real nginx/certbot path is covered by nginxProvisioning.test.js.
//
// Run: npm i --no-save mongodb-memory-server@10 && NODE_OPTIONS=--experimental-vm-modules npx jest tests/domains

import mongoose from 'mongoose';

let MongoMemoryServer;
try {
    ({ MongoMemoryServer } = await import('mongodb-memory-server'));
} catch {
    MongoMemoryServer = null;
}
const describeDb = MongoMemoryServer ? describe : describe.skip;

process.env.VPS_PUBLIC_IPV4 = '203.0.113.10';
process.env.SSL_MAX_ATTEMPTS = '3';
process.env.ACME_MAX_ISSUANCES_PER_HOUR = '10';

const { default: User } = await import('../../models/User.js');
const { default: CustomDomainRequest } = await import('../../models/CustomDomainRequest.js');
const svc = await import('../../services/domains/vpsDomainService.js');
const { findTenantForHost } = await import('../../middlewares/whiteLabel.js');

const DAY = 86400000;

// Fake world: per-domain DNS correctness, probe reachability, helper results.
function makeWorld() {
    const world = {
        now: new Date('2026-11-11T12:00:00Z'),
        dnsOk: new Set(),
        httpOk: new Set(),
        httpsOk: new Set(),
        issueFail: new Map(),     // domain -> message
        certDays: 90,
        calls: [],
        alerts: [],
        notices: []
    };
    svc.__setDeps({
        now: () => world.now,
        checkDns: async (doc) => world.dnsOk.has(doc.domainName)
            ? { ok: true, apexOk: true, wwwOk: true, txtOk: true, ipv6Ok: true, apexRecords: ['203.0.113.10'], wwwRecords: ['203.0.113.10'], message: 'DNS records are correct.' }
            : { ok: false, apexOk: false, wwwOk: false, txtOk: false, ipv6Ok: true, apexRecords: [], wwwRecords: [], message: 'no A record' },
        runHelper: async (action, domain) => {
            world.calls.push(`${action}:${domain}`);
            if (action === 'issue' && world.issueFail.has(domain)) return { ok: false, message: world.issueFail.get(domain) };
            const notAfter = new Date(world.now.getTime() + world.certDays * DAY).toUTCString();
            return { ok: true, action, domain, message: 'ok', notAfter, issuer: "Let's Encrypt" };
        },
        probeHttp: async (host) => {
            const apex = host.replace(/^www\./, '');
            return world.httpOk.has(apex) ? { ok: true, status: 200, body: apex } : { ok: false, error: 'ECONNREFUSED' };
        },
        probeHttps: async (host) => {
            const apex = host.replace(/^www\./, '');
            return world.httpsOk.has(apex)
                ? { ok: true, status: 200, body: apex, validTo: new Date(world.now.getTime() + world.certDays * DAY) }
                : { ok: false, error: 'CERT_HAS_EXPIRED' };
        },
        notifyReseller: async (userId, title) => { world.notices.push({ userId: String(userId), title }); },
        alertAdmin: async (subject) => { world.alerts.push(subject); }
    });
    return world;
}

const reachable = (world, domain) => { world.dnsOk.add(domain); world.httpOk.add(domain); world.httpsOk.add(domain); };
const advance = async (doc, times = 1) => { let d = doc; for (let i = 0; i < times; i++) d = await svc.processDomain(d._id, { force: true }); return d; };
const userDomain = async (id) => (await User.findById(id).select('customDomain')).customDomain;

describeDb('VPS custom domain lifecycle', () => {
    let mongod;
    let resellerA, resellerB, plainUser;
    let world;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri());
        await CustomDomainRequest.syncIndexes();
        await User.syncIndexes();
    }, 120000);

    afterAll(async () => {
        await mongoose.disconnect();
        await mongod?.stop();
    });

    beforeEach(async () => {
        await CustomDomainRequest.deleteMany({});
        await User.deleteMany({});
        resellerA = await User.create({ name: 'Reseller A', email: 'a@example.com', password: 'x', role: 'reseller_admin', subdomain: 'alpha' });
        resellerB = await User.create({ name: 'Reseller B', email: 'b@example.com', password: 'x', role: 'reseller_admin', subdomain: 'bravo' });
        plainUser = await User.create({ name: 'Customer', email: 'c@example.com', password: 'x', role: 'user' });
        world = makeWorld();
    });

    test('a domain goes pending_dns -> verifying -> pending_ssl -> active, and routing is only set at the end', async () => {
        let doc = await svc.createDomain({ resellerId: resellerA._id, domain: 'https://www.ShopA.com/' });
        expect(doc.domainName).toBe('shopa.com');
        expect(doc.includeWww).toBe(true);
        expect(doc.domainState).toBe('pending_dns');
        expect(doc.verificationToken).toMatch(/^[0-9a-f]{32}$/);

        doc = await advance(doc);
        expect(doc.domainState).toBe('pending_dns');
        expect(await userDomain(resellerA._id)).toBeUndefined();

        // DNS correct but the http probe does not reach us yet: stays pending.
        world.dnsOk.add('shopa.com');
        doc = await advance(doc);
        expect(doc.domainState).toBe('pending_dns');
        expect(doc.lastError).toMatch(/does not reach this server/);
        expect(world.calls).toContain('prepare:shopa.com');
        expect(await userDomain(resellerA._id)).toBeUndefined();

        // Reachable over http but certificate not served yet: issued, not active.
        world.httpOk.add('shopa.com');
        doc = await advance(doc);
        expect(doc.domainState).toBe('pending_ssl');
        expect(world.calls).toContain('issue:shopa.com');
        expect(await userDomain(resellerA._id)).toBeUndefined();

        // Next step must not ask Let's Encrypt again (cert exists), only re-probe.
        const issues = world.calls.filter((c) => c === 'issue:shopa.com').length;
        world.httpsOk.add('shopa.com');
        doc = await advance(doc);
        expect(world.calls.filter((c) => c === 'issue:shopa.com').length).toBe(issues);
        expect(doc.domainState).toBe('active');
        expect(doc.status).toBe('Connected Successfully');
        expect(doc.ssl.expiresAt.getTime()).toBeGreaterThan(world.now.getTime());
        expect(await userDomain(resellerA._id)).toBe('shopa.com');
        expect(world.notices.map((n) => n.title)).toContain('Your website is live');
    });

    test('multiple resellers with different domains route to the right storefront', async () => {
        reachable(world, 'shopa.com');
        reachable(world, 'shopb.com');
        const a = await advance(await svc.createDomain({ resellerId: resellerA._id, domain: 'shopa.com' }));
        const b = await advance(await svc.createDomain({ resellerId: resellerB._id, domain: 'shopb.com' }));
        expect(a.domainState).toBe('active');
        expect(b.domainState).toBe('active');

        expect(String((await findTenantForHost('shopa.com'))._id)).toBe(String(resellerA._id));
        expect(String((await findTenantForHost('shopb.com'))._id)).toBe(String(resellerB._id));
        expect(String((await findTenantForHost('alpha.9jasub.com'))._id)).toBe(String(resellerA._id));
        expect(String((await findTenantForHost('bravo.9jasub.com'))._id)).toBe(String(resellerB._id));
        // Hostname spoofing: a foreign host whose first label is a reseller subdomain.
        expect(await findTenantForHost('alpha.attacker.com')).toBeNull();
        expect(await findTenantForHost('unknown.com')).toBeNull();
    });

    test('legacy fallback: only listed hosts resolve by first label (production midataplus.com)', async () => {
        const legacy = await User.create({ name: 'MiData', email: 'm@example.com', password: 'x', role: 'reseller_admin', subdomain: 'midataplus' });
        // Default list keeps today's production domain working without customDomain.
        expect(String((await findTenantForHost('midataplus.com'))._id)).toBe(String(legacy._id));
        // An unlisted host with a reseller's subdomain as first label does not.
        expect(await findTenantForHost('alpha.com')).toBeNull();
        expect(await findTenantForHost('midataplus.net')).toBeNull();
        process.env.LEGACY_HOST_SUBDOMAIN_FALLBACK = '';
        try {
            expect(await findTenantForHost('midataplus.com')).toBeNull();
            // Once linked (customDomain stored), the fallback is no longer needed.
            await User.updateOne({ _id: legacy._id }, { $set: { customDomain: 'midataplus.com' } });
            expect(String((await findTenantForHost('midataplus.com'))._id)).toBe(String(legacy._id));
        } finally {
            delete process.env.LEGACY_HOST_SUBDOMAIN_FALLBACK;
        }
    });

    test('ownership: a domain belongs to exactly one reseller', async () => {
        await svc.createDomain({ resellerId: resellerA._id, domain: 'shopa.com' });
        await expect(svc.createDomain({ resellerId: resellerB._id, domain: 'SHOPA.com' })).rejects.toMatchObject({ code: 'DOMAIN_TAKEN' });
        await expect(svc.createDomain({ resellerId: resellerA._id, domain: 'second.com' })).rejects.toMatchObject({ code: 'RESELLER_HAS_DOMAIN' });
        await expect(svc.createDomain({ resellerId: plainUser._id, domain: 'cust.com' })).rejects.toMatchObject({ code: 'INVALID_RESELLER' });
        await expect(svc.createDomain({ resellerId: resellerB._id, domain: 'bravo.9jasub.com' })).rejects.toMatchObject({ code: 'RESERVED_DOMAIN' });
        await expect(svc.createDomain({ resellerId: resellerB._id, domain: '10.0.0.1' })).rejects.toThrow();
    });

    test('a domain already routed to another account (legacy customDomain) cannot be claimed or activated', async () => {
        await User.updateOne({ _id: resellerB._id }, { $set: { customDomain: 'legacy.com' } });
        await expect(svc.createDomain({ resellerId: resellerA._id, domain: 'legacy.com' })).rejects.toMatchObject({ code: 'DOMAIN_TAKEN' });

        // Race: B gets the domain after A's record was created but before activation.
        reachable(world, 'race.com');
        const doc = await svc.createDomain({ resellerId: resellerA._id, domain: 'race.com' });
        await User.updateOne({ _id: resellerB._id }, { $set: { customDomain: 'race.com' } });
        const done = await advance(doc);
        expect(done.domainState).toBe('failed');
        expect(await userDomain(resellerA._id)).toBeUndefined();
        expect(await userDomain(resellerB._id)).toBe('race.com');
    });

    test('database rejects duplicate VPS domains even if the app check is bypassed', async () => {
        await svc.createDomain({ resellerId: resellerA._id, domain: 'dup.com' });
        await expect(CustomDomainRequest.create({ resellerId: resellerB._id, domainOption: 'custom_domain', domainName: 'dup.com', provider: 'vps' })).rejects.toMatchObject({ code: 11000 });
    });

    test('DNS that never arrives fails after the timeout; admin retry restarts verification', async () => {
        let doc = await svc.createDomain({ resellerId: resellerA._id, domain: 'slow.com' });
        world.now = new Date(world.now.getTime() + 73 * 3600000);
        doc = await advance(doc);
        expect(doc.domainState).toBe('failed');
        expect(doc.lastError).toMatch(/72 hours/);

        reachable(world, 'slow.com');
        doc = await svc.retryVerification(doc._id);
        expect(doc.domainState).toBe('active');
    });

    test('SSL failures back off, then fail with an admin alert; rate limits wait 24h without counting', async () => {
        world.dnsOk.add('ssl.com');
        world.httpOk.add('ssl.com');
        world.issueFail.set('ssl.com', 'Connection refused while validating');
        let doc = await advance(await svc.createDomain({ resellerId: resellerA._id, domain: 'ssl.com' }));
        expect(doc.domainState).toBe('pending_ssl');
        expect(doc.ssl.attempts).toBe(1);
        expect(doc.ssl.nextAttemptAt.getTime() - world.now.getTime()).toBe(15 * 60000);

        // Not forced and inside the backoff window: no new ACME request.
        const before = world.calls.length;
        doc = await svc.processDomain(doc._id);
        expect(world.calls.length).toBe(before);

        doc = await advance(doc);
        expect(doc.ssl.attempts).toBe(2);
        expect(doc.ssl.nextAttemptAt.getTime() - world.now.getTime()).toBe(30 * 60000);

        world.issueFail.set('ssl.com', 'Error: too many certificates already issued (rate limit)');
        doc = await advance(doc);
        expect(doc.ssl.attempts).toBe(2);
        expect(doc.ssl.nextAttemptAt.getTime() - world.now.getTime()).toBe(24 * 3600000);

        world.issueFail.set('ssl.com', 'Connection refused while validating');
        doc = await advance(doc);
        expect(doc.ssl.attempts).toBe(3);
        expect(doc.domainState).toBe('failed');
        expect(world.alerts).toContain('SSL failed: ssl.com');

        // Admin "Retry SSL" resets attempts and succeeds once the cause is fixed.
        world.issueFail.delete('ssl.com');
        world.httpsOk.add('ssl.com');
        doc = await svc.retrySsl(doc._id);
        expect(doc.domainState).toBe('active');
        expect(doc.ssl.attempts).toBe(0);
    });

    test('global hourly cap on certificate requests protects the Let\'s Encrypt account', async () => {
        process.env.ACME_MAX_ISSUANCES_PER_HOUR = '1';
        try {
            await CustomDomainRequest.create({ resellerId: resellerB._id, domainOption: 'custom_domain', domainName: 'other.com', provider: 'vps', domainState: 'pending_ssl', ssl: { lastAttemptAt: world.now } });
            world.dnsOk.add('capped.com');
            world.httpOk.add('capped.com');
            const doc = await advance(await svc.createDomain({ resellerId: resellerA._id, domain: 'capped.com' }));
            expect(doc.domainState).toBe('pending_ssl');
            expect(world.calls).not.toContain('issue:capped.com');
            expect(doc.lastError).toMatch(/hourly certificate request limit/);
        } finally {
            process.env.ACME_MAX_ISSUANCES_PER_HOUR = '10';
        }
    });

    test('expiry monitoring: renewal-required state, one alert per day, back to active after renewal', async () => {
        reachable(world, 'exp.com');
        let doc = await advance(await svc.createDomain({ resellerId: resellerA._id, domain: 'exp.com' }));
        expect(doc.domainState).toBe('active');

        world.certDays = 10;
        doc = await advance(doc);
        expect(doc.domainState).toBe('ssl_renewal_required');
        expect(world.alerts.filter((a) => a === 'SSL renewal needed: exp.com')).toHaveLength(1);
        doc = await advance(doc);
        expect(world.alerts.filter((a) => a === 'SSL renewal needed: exp.com')).toHaveLength(1);
        // Still routed: an expiring certificate is not a reason to take the site down.
        expect(await userDomain(resellerA._id)).toBe('exp.com');

        world.certDays = 89;
        doc = await svc.retrySsl(doc._id);
        expect(world.calls).toContain('renew:exp.com');
        expect(doc.domainState).toBe('active');
    });

    test('active checks are throttled unless forced', async () => {
        reachable(world, 'thr.com');
        let doc = await advance(await svc.createDomain({ resellerId: resellerA._id, domain: 'thr.com' }));
        world.certDays = 5;
        doc = await svc.processDomain(doc._id);
        expect(doc.domainState).toBe('active');
        world.now = new Date(world.now.getTime() + 7 * 3600000);
        doc = await svc.processDomain(doc._id);
        expect(doc.domainState).toBe('ssl_renewal_required');
    });

    test('suspend removes routing and keeps the record; resume re-verifies', async () => {
        reachable(world, 'sus.com');
        let doc = await advance(await svc.createDomain({ resellerId: resellerA._id, domain: 'sus.com' }));
        expect(await userDomain(resellerA._id)).toBe('sus.com');
        doc = await svc.suspendDomain(doc._id, 'unpaid');
        expect(doc.domainState).toBe('suspended');
        expect(await userDomain(resellerA._id)).toBeUndefined();
        expect(await findTenantForHost('sus.com')).toBeNull();
        doc = await svc.resumeDomain(doc._id);
        expect(doc.domainState).toBe('active');
        expect(await userDomain(resellerA._id)).toBe('sus.com');
    });

    test('remove deletes nginx config, routing and the record; another reseller can then use the domain', async () => {
        reachable(world, 'rm.com');
        const doc = await advance(await svc.createDomain({ resellerId: resellerA._id, domain: 'rm.com' }));
        const res = await svc.removeDomain(doc._id);
        expect(res).toEqual({ removed: true, domain: 'rm.com' });
        expect(world.calls).toContain('remove:rm.com');
        expect(await CustomDomainRequest.countDocuments({ domainName: 'rm.com' })).toBe(0);
        expect(await userDomain(resellerA._id)).toBeUndefined();
        await expect(svc.createDomain({ resellerId: resellerB._id, domain: 'rm.com' })).resolves.toBeTruthy();
    });

    test('reseller disconnect request: reject keeps the domain, approve removes it', async () => {
        reachable(world, 'dc.com');
        const doc = await advance(await svc.createDomain({ resellerId: resellerA._id, domain: 'dc.com' }));
        await expect(svc.requestDisconnect(resellerB._id, 'x')).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await svc.requestDisconnect(resellerA._id, 'moving');
        expect(world.alerts).toContain('Domain disconnect requested: dc.com');
        let r = await svc.resolveDisconnect(doc._id, false);
        expect(r.disconnectRequest.status).toBe('rejected');
        expect(await userDomain(resellerA._id)).toBe('dc.com');
        await svc.requestDisconnect(resellerA._id, 'again');
        r = await svc.resolveDisconnect(doc._id, true);
        expect(r.removed).toBe(true);
    });

    test('server-side setup failure (e.g. hostname used by another site on the VPS) fails with an alert', async () => {
        world.dnsOk.add('taken.com');
        svc.__setDeps({
            now: () => world.now,
            checkDns: async () => ({ ok: true, apexOk: true, wwwOk: true, txtOk: true, ipv6Ok: true, apexRecords: [], wwwRecords: [], message: '' }),
            runHelper: async () => ({ ok: false, message: 'Refused: already served by another site on this server' }),
            notifyReseller: async () => {},
            alertAdmin: async (s) => { world.alerts.push(s); }
        });
        const doc = await advance(await svc.createDomain({ resellerId: resellerA._id, domain: 'taken.com' }));
        expect(doc.domainState).toBe('failed');
        expect(doc.lastError).toMatch(/another site/);
        expect(world.alerts).toContain('Domain setup failed: taken.com');
    });

    test('concurrent workers never provision the same domain twice', async () => {
        world.dnsOk.add('lock.com');
        world.httpOk.add('lock.com');
        let slowIssues = 0;
        svc.__setDeps({
            now: () => world.now,
            checkDns: async () => ({ ok: true, apexOk: true, wwwOk: true, txtOk: true, ipv6Ok: true, apexRecords: [], wwwRecords: [], message: '' }),
            runHelper: async (action) => {
                if (action === 'issue') { slowIssues++; await new Promise((r) => setTimeout(r, 200)); }
                return { ok: true, notAfter: new Date(world.now.getTime() + 90 * DAY).toUTCString() };
            },
            probeHttp: async (h) => ({ ok: true, status: 200, body: h.replace(/^www\./, '') }),
            probeHttps: async (h) => ({ ok: true, status: 200, body: h.replace(/^www\./, ''), validTo: new Date(world.now.getTime() + 90 * DAY) }),
            notifyReseller: async () => {},
            alertAdmin: async () => {}
        });
        const doc = await svc.createDomain({ resellerId: resellerA._id, domain: 'lock.com' });
        await Promise.all([svc.processDomain(doc._id, { force: true }), svc.processDomain(doc._id, { force: true }), svc.processDomain(doc._id, { force: true })]);
        expect(slowIssues).toBe(1);
        expect((await CustomDomainRequest.findById(doc._id)).domainState).toBe('active');
    });

    test('tick() advances pending domains and skips failed/suspended ones', async () => {
        reachable(world, 'tick.com');
        await svc.createDomain({ resellerId: resellerA._id, domain: 'tick.com' });
        await CustomDomainRequest.create({ resellerId: resellerB._id, domainOption: 'custom_domain', domainName: 'dead.com', provider: 'vps', domainState: 'failed' });
        await svc.tick();
        expect((await CustomDomainRequest.findOne({ domainName: 'tick.com' })).domainState).toBe('active');
        expect(world.calls.some((c) => c.endsWith(':dead.com'))).toBe(false);
    });

    test('reseller view hides other tenants\' data and admin-only history', async () => {
        const doc = await svc.createDomain({ resellerId: resellerA._id, domain: 'view.com' });
        const view = svc.serializeDomain(doc, { forReseller: true });
        expect(view.reseller).toBeUndefined();
        expect(view.history).toBeUndefined();
        expect(view.requiredRecords.map((r) => r.type)).toEqual(['A', 'A', 'TXT']);
        expect(JSON.stringify(view)).not.toContain('b@example.com');
    });

    test('generate platform subdomain: assigns, refuses taken and reserved labels', async () => {
        const fresh = await User.create({ name: 'New', email: 'n@example.com', password: 'x', role: 'reseller_admin' });
        const r = await svc.generatePlatformSubdomain({ resellerId: fresh._id, label: 'newshop' });
        expect(r).toMatchObject({ subdomain: 'newshop', url: 'https://newshop.9jasub.com', created: true });
        expect(String((await findTenantForHost('newshop.9jasub.com'))._id)).toBe(String(fresh._id));
        await expect(svc.generatePlatformSubdomain({ resellerId: fresh._id, label: 'alpha' })).rejects.toMatchObject({ code: 'DOMAIN_TAKEN' });
        await expect(svc.generatePlatformSubdomain({ resellerId: fresh._id, label: 'admin' })).rejects.toMatchObject({ code: 'RESERVED_DOMAIN' });
    });
});
