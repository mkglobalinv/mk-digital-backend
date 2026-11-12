// Settings service on a real MongoDB (mongodb-memory-server): encryption at
// rest, masking, validation, .env fallback, startup load, toggles, audit.
import crypto from 'crypto';
import mongoose from 'mongoose';

let MongoMemoryServer;
try { ({ MongoMemoryServer } = await import('mongodb-memory-server')); } catch { MongoMemoryServer = null; }
const describeDb = MongoMemoryServer ? describe : describe.skip;

const MASTER = crypto.randomBytes(32).toString('hex');
process.env.SETTINGS_ENCRYPTION_KEY = MASTER;
// .env values present at startup (the fallback).
process.env.PAYSTACK_SECRET_KEY = 'sk_env_original_value_0000';
delete process.env.FLW_SECRET_KEY;
delete process.env.SMEPLUG_ENABLED;

const svc = await import('../../services/settings/settingsService.js');
const { onConfigChange } = await import('../../services/settings/runtimeConfig.js');
const { default: IntegrationCredential } = await import('../../models/IntegrationCredential.js');
const { default: IntegrationAuditLog } = await import('../../models/IntegrationAuditLog.js');
const { default: ProviderStatus } = await import('../../models/ProviderStatus.js');

const SECRET = 'FLWSECK-live-1234567890abcdefXYZW';
const actor = { id: new mongoose.Types.ObjectId(), email: 'owner@example.com', ip: '127.0.0.1' };
const provider = (view, id) => view.providers.find((p) => p.id === id);
const field = (view, id, key) => provider(view, id).settings.find((s) => s.key === key);

describeDb('settingsService', () => {
    let mongod;
    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri());
    }, 120000);
    afterAll(async () => { await mongoose.disconnect(); await mongod?.stop(); });
    beforeEach(async () => {
        process.env.SETTINGS_ENCRYPTION_KEY = MASTER;
        await Promise.all([IntegrationCredential.deleteMany({}), IntegrationAuditLog.deleteMany({}), ProviderStatus.deleteMany({})]);
    });

    test('saving encrypts at rest, applies to process.env immediately and returns only a mask', async () => {
        const seen = [];
        const off = onConfigChange((keys) => seen.push(...keys));
        await svc.saveSettings({ FLW_SECRET_KEY: SECRET }, actor);
        off();

        const raw = await mongoose.connection.collection('integrationcredentials').findOne({ key: 'FLW_SECRET_KEY' });
        expect(JSON.stringify(raw)).not.toContain(SECRET);
        expect(JSON.stringify(raw)).not.toContain('1234567890');
        expect(raw.value).toEqual(expect.objectContaining({ v: 1, iv: expect.any(String), tag: expect.any(String), ct: expect.any(String) }));

        expect(process.env.FLW_SECRET_KEY).toBe(SECRET);
        expect(seen).toContain('FLW_SECRET_KEY');

        const view = await svc.getSettingsView();
        expect(JSON.stringify(view)).not.toContain(SECRET);
        expect(field(view, 'flutterwave', 'FLW_SECRET_KEY')).toMatchObject({ isSet: true, source: 'dashboard', display: '••••••••XYZW' });
    });

    test('short secrets are fully masked; URLs and IDs that are not credentials are shown', async () => {
        await svc.saveSettings({ PAYMENTPOINT_BUSINESS_ID: 'biz123', SUPABASE_URL: 'https://abc.supabase.co/' }, actor);
        const view = await svc.getSettingsView();
        expect(field(view, 'paymentpoint', 'PAYMENTPOINT_BUSINESS_ID').display).toBe('••••••••');
        expect(field(view, 'supabase', 'SUPABASE_URL').display).toBe('https://abc.supabase.co');
    });

    test('.env values are used and reported when nothing is saved; clearing restores them', async () => {
        let view = await svc.getSettingsView();
        expect(field(view, 'paystack', 'PAYSTACK_SECRET_KEY')).toMatchObject({ source: 'environment', display: '••••••••0000' });

        await svc.saveSettings({ PAYSTACK_SECRET_KEY: 'sk_live_dashboard_value_9999' }, actor);
        expect(process.env.PAYSTACK_SECRET_KEY).toBe('sk_live_dashboard_value_9999');

        await svc.saveSettings({ PAYSTACK_SECRET_KEY: null }, actor);
        expect(process.env.PAYSTACK_SECRET_KEY).toBe('sk_env_original_value_0000');
        expect(await IntegrationCredential.countDocuments({ key: 'PAYSTACK_SECRET_KEY' })).toBe(0);
        view = await svc.getSettingsView();
        expect(field(view, 'paystack', 'PAYSTACK_SECRET_KEY').source).toBe('environment');
    });

    test('validation rejects bad input and saves nothing when any value is invalid', async () => {
        const bad = [
            [{ SUPABASE_URL: 'http://insecure.example.com' }, /https/],
            [{ SUPABASE_URL: 'https://user:pass@x.co' }, /username or password/],
            [{ FLW_SECRET_KEY: 'has space inside' }, /no spaces/],
            [{ FLW_SECRET_KEY: '••••••••XYZW' }, /masked/],
            [{ EMAIL_PORT: '99999' }, /port/],
            [{ EMAIL_FROM: 'not-an-email' }, /email/],
            [{ VPS_PUBLIC_IPV4: '999.1.1.1' }, /IPv4/],
            [{ NEXT_PUBLIC_GA_MEASUREMENT_ID: 'UA-1234' }, /G-/],
            [{ LEGACY_HOST_SUBDOMAIN_FALLBACK: 'ok.com, bad host' }, /domain/],
            [{ EMAIL_SENDER_NAME: 'Evil" <x@y>' }, /quotes/],
            [{ NOT_A_SETTING: 'x' }, /Unknown/],
            [{ JWT_SECRET: 'x'.repeat(20) }, /Unknown/],
            [{ FLW_SECRET_KEY: { $gt: '' } }, /text/],
            [[], /No changes/],
            [{}, /No changes/]
        ];
        for (const [changes, msg] of bad) {
            await expect(svc.saveSettings(changes, actor)).rejects.toThrow(msg);
        }
        await expect(svc.saveSettings({ FLW_WEBHOOK_HASH: 'valid-hash-value-123', SUPABASE_URL: 'nope' }, actor)).rejects.toThrow();
        expect(await IntegrationCredential.countDocuments({})).toBe(0);
    });

    test('without SETTINGS_ENCRYPTION_KEY nothing can be saved (but clearing still works)', async () => {
        delete process.env.SETTINGS_ENCRYPTION_KEY;
        await expect(svc.saveSettings({ FLW_SECRET_KEY: SECRET }, actor)).rejects.toThrow(/SETTINGS_ENCRYPTION_KEY/);
        await expect(svc.saveSettings({ FLW_SECRET_KEY: null }, actor)).resolves.toEqual(['FLW_SECRET_KEY']);
        expect((await svc.getSettingsView()).encryption.configured).toBe(false);
    });

    test('startup load applies saved values; undecryptable values fall back to .env', async () => {
        await svc.saveSettings({ FLW_SECRET_KEY: SECRET, PAYSTACK_SECRET_KEY: 'sk_live_saved_value_1111' }, actor);
        delete process.env.FLW_SECRET_KEY;
        process.env.PAYSTACK_SECRET_KEY = 'sk_env_original_value_0000';

        const res = await svc.loadSettingsIntoRuntime();
        expect(res).toEqual({ loaded: 2, errors: [] });
        expect(process.env.FLW_SECRET_KEY).toBe(SECRET);
        expect(process.env.PAYSTACK_SECRET_KEY).toBe('sk_live_saved_value_1111');

        // Master key rotated without re-encrypting: values are unreadable, .env stays.
        process.env.SETTINGS_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
        process.env.PAYSTACK_SECRET_KEY = 'sk_env_original_value_0000';
        const after = await svc.loadSettingsIntoRuntime();
        expect(after.errors.sort()).toEqual(['FLW_SECRET_KEY', 'PAYSTACK_SECRET_KEY']);
        expect(process.env.PAYSTACK_SECRET_KEY).toBe('sk_env_original_value_0000');
        expect((await svc.getSettingsView()).encryption.loadErrors.sort()).toEqual(['FLW_SECRET_KEY', 'PAYSTACK_SECRET_KEY']);
    });

    test('audit log records who changed what, never the value', async () => {
        await svc.saveSettings({ FLW_SECRET_KEY: SECRET }, actor);
        await svc.saveSettings({ FLW_SECRET_KEY: null }, actor);
        const entries = await svc.getAuditLog();
        expect(entries.map((e) => e.action)).toEqual(['setting.cleared', 'setting.updated']);
        expect(entries[0]).toMatchObject({ actorEmail: 'owner@example.com', target: 'FLW_SECRET_KEY', ip: '127.0.0.1' });
        expect(JSON.stringify(entries)).not.toContain(SECRET);
    });

    test('provider status: Not Configured -> untested -> Connected / Failed', async () => {
        delete process.env.FLW_SECRET_KEY;
        delete process.env.FLW_WEBHOOK_HASH;
        expect(provider(await svc.getSettingsView(), 'flutterwave').status).toBe('not_configured');
        await svc.saveSettings({ FLW_SECRET_KEY: SECRET, FLW_WEBHOOK_HASH: 'webhook-hash-value-1' }, actor);
        expect(provider(await svc.getSettingsView(), 'flutterwave').status).toBe('untested');
        await svc.recordTestResult('flutterwave', { ok: true, message: 'Connected.' }, actor);
        expect(provider(await svc.getSettingsView(), 'flutterwave')).toMatchObject({ status: 'connected', lastTest: { message: 'Connected.', byEmail: 'owner@example.com' } });
        await svc.recordTestResult('flutterwave', { ok: false, message: 'Rejected credentials (HTTP 401).' }, actor);
        expect(provider(await svc.getSettingsView(), 'flutterwave').status).toBe('failed');
    });

    test('enable/disable uses the switches the code already honours', async () => {
        await ProviderStatus.create({ providerName: 'peyflex', isAvailable: true, manualDisabled: false });
        await svc.setProviderEnabled('peyflex', false, actor);
        expect(await ProviderStatus.findOne({ providerName: 'peyflex' }).lean()).toMatchObject({ manualDisabled: true, isAvailable: false });
        expect(provider(await svc.getSettingsView(), 'peyflex').enabled).toBe(false);
        await svc.setProviderEnabled('peyflex', true, actor);
        expect(provider(await svc.getSettingsView(), 'peyflex').enabled).toBe(true);

        await svc.setProviderEnabled('smeplug', true, actor);
        expect(process.env.SMEPLUG_ENABLED).toBe('true');
        expect(provider(await svc.getSettingsView(), 'smeplug').enabled).toBe(true);

        // Unset switches show what the code does: SMEPlug/Ogdams default off, domain processing on.
        delete process.env.OGDAMS_ENABLED;
        delete process.env.VPS_DOMAINS_ENABLED;
        const v = await svc.getSettingsView();
        expect(provider(v, 'ogdams').enabled).toBe(false);
        expect(provider(v, 'customDomains').enabled).toBe(true);

        await expect(svc.setProviderEnabled('flutterwave', false, actor)).rejects.toThrow(/no switch/);
        await expect(svc.setProviderEnabled('nope', true, actor)).rejects.toThrow(/Unknown/);
        await expect(svc.setProviderEnabled('peyflex', 'yes', actor)).rejects.toThrow(/true or false/);
        const actions = (await svc.getAuditLog()).map((e) => e.action);
        expect(actions).toEqual(expect.arrayContaining(['provider.disabled', 'provider.enabled']));
    });

    test('redactSecrets strips configured secret values from messages', async () => {
        await svc.saveSettings({ FLW_SECRET_KEY: SECRET }, actor);
        expect(svc.redactSecrets(`Request failed: Bearer ${SECRET} rejected`)).toBe('Request failed: Bearer [redacted] rejected');
    });
});
