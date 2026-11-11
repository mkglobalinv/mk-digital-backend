// DNS verification against fake public resolvers (no network).
import { checkDomainDns, requiredDnsRecords, txtRecordValue } from '../../services/domains/dnsVerifier.js';

const VPS = '203.0.113.10';
const TOKEN = 'abc123';
const notFound = () => Object.assign(new Error('not found'), { code: 'ENOTFOUND' });

// zones: { 'name': { A: [...], AAAA: [...], TXT: [[...]] } } per resolver server.
const factoryFor = (zonesByServer) => (server) => {
    const zones = zonesByServer[server] || zonesByServer.default;
    const get = (type) => async (name) => {
        const rec = zones[name]?.[type];
        if (!rec || rec.length === 0) throw notFound();
        return rec;
    };
    return { resolve4: get('A'), resolve6: get('AAAA'), resolveTxt: get('TXT') };
};

const goodZone = {
    'shop.com': { A: [VPS] },
    'www.shop.com': { A: [VPS] },
    '_9jasub-verify.shop.com': { TXT: [[txtRecordValue(TOKEN)]] }
};

beforeEach(() => {
    process.env.VPS_PUBLIC_IPV4 = VPS;
    process.env.DNS_RESOLVERS = '1.1.1.1,8.8.8.8';
    delete process.env.VPS_PUBLIC_IPV6;
    delete process.env.DOMAIN_REQUIRE_TXT_VERIFICATION;
});

const check = (zones, extra = {}) => checkDomainDns({ domain: 'shop.com', includeWww: true, verificationToken: TOKEN, ...extra }, { resolverFactory: factoryFor(zones) });

test('passes when A, www and TXT are correct on every resolver', async () => {
    const r = await check({ default: goodZone });
    expect(r.ok).toBe(true);
    expect(r.apexRecords).toEqual([VPS]);
});

test('fails when the A record points elsewhere', async () => {
    const r = await check({ default: { ...goodZone, 'shop.com': { A: ['198.51.100.7'] } } });
    expect(r.ok).toBe(false);
    expect(r.apexOk).toBe(false);
    expect(r.message).toContain('198.51.100.7');
});

test('fails when an extra A record also points elsewhere (round-robin)', async () => {
    const r = await check({ default: { ...goodZone, 'shop.com': { A: [VPS, '198.51.100.7'] } } });
    expect(r.ok).toBe(false);
});

test('fails when www is missing but required, passes when www is not requested', async () => {
    const zone = { ...goodZone };
    delete zone['www.shop.com'];
    expect((await check({ default: zone })).wwwOk).toBe(false);
    expect((await check({ default: zone }, { includeWww: false })).ok).toBe(true);
});

test('fails without the ownership TXT record, unless TXT verification is disabled', async () => {
    const zone = { ...goodZone, '_9jasub-verify.shop.com': { TXT: [['9jasub-verify=wrong']] } };
    const r = await check({ default: zone });
    expect(r.txtOk).toBe(false);
    expect(r.message).toContain('_9jasub-verify.shop.com');
    process.env.DOMAIN_REQUIRE_TXT_VERIFICATION = 'false';
    expect((await check({ default: zone })).ok).toBe(true);
});

test('fails on an AAAA record pointing away from the VPS', async () => {
    const r = await check({ default: { ...goodZone, 'shop.com': { A: [VPS], AAAA: ['2001:db8::1'] } } });
    expect(r.ok).toBe(false);
    expect(r.ipv6Ok).toBe(false);
    process.env.VPS_PUBLIC_IPV6 = '2001:db8::1';
    expect((await check({ default: { ...goodZone, 'shop.com': { A: [VPS], AAAA: ['2001:db8::1'] } } })).ok).toBe(true);
});

test('reports propagation in progress when resolvers disagree', async () => {
    const r = await check({ '1.1.1.1': goodZone, '8.8.8.8': { ...goodZone, 'shop.com': { A: ['198.51.100.7'] } } });
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/propagating/);
});

test('fails safely when VPS_PUBLIC_IPV4 is not configured', async () => {
    delete process.env.VPS_PUBLIC_IPV4;
    const r = await check({ default: goodZone });
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/VPS_PUBLIC_IPV4/);
});

test('requiredDnsRecords lists A @, A www and the TXT ownership record', () => {
    const recs = requiredDnsRecords({ domain: 'shop.com', includeWww: true, verificationToken: TOKEN });
    expect(recs).toEqual([
        expect.objectContaining({ type: 'A', host: '@', value: VPS }),
        expect.objectContaining({ type: 'A', host: 'www', value: VPS }),
        expect.objectContaining({ type: 'TXT', host: '_9jasub-verify', value: `9jasub-verify=${TOKEN}` })
    ]);
});
