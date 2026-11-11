// Hostname rules for reseller custom domains and platform-subdomain parsing.
import { normalizeDomain, defaultIncludeWww, platformSubdomainOf, normalizeSubdomainLabel, DomainValidationError } from '../../services/domains/domainValidation.js';

describe('normalizeDomain', () => {
    test.each([
        ['mybusiness.com', 'mybusiness.com'],
        ['  MyBusiness.COM  ', 'mybusiness.com'],
        ['https://www.mybusiness.com/shop?x=1', 'mybusiness.com'],
        ['http://shop.mybusiness.com.ng:8080/', 'shop.mybusiness.com.ng'],
        ['mybusiness.com.', 'mybusiness.com'],
        ['bücher.de', 'xn--bcher-kva.de']
    ])('accepts %s as %s', (input, expected) => {
        expect(normalizeDomain(input)).toBe(expected);
    });

    test.each([
        ['', 'empty'],
        ['localhost', 'single label'],
        ['192.168.1.10', 'IPv4'],
        ['[::1]', 'IPv6'],
        ['*.mybusiness.com', 'wildcard'],
        ['my_business.com', 'underscore'],
        ['-bad.com', 'leading hyphen'],
        ['bad-.com', 'trailing hyphen'],
        ['mybusiness.c0m', 'numeric TLD'],
        ['shop.local', 'local TLD'],
        ['app.internal', 'internal TLD'],
        ['x.up.railway.app', 'hosting provider domain'],
        ['mybusiness.com; rm -rf /', 'shell metacharacters'],
        ['mybusiness.com$(id)', 'command substitution'],
        ['user@mybusiness.com', 'userinfo'],
        [`${'a'.repeat(64)}.com`, 'label over 63 chars'],
        [`${'a.'.repeat(130)}com`, 'over 253 chars'],
        [null, 'not a string']
    ])('rejects %s (%s)', (input) => {
        expect(() => normalizeDomain(input)).toThrow(DomainValidationError);
    });

    test('rejects platform domains and their subdomains', () => {
        for (const d of ['9jasub.com', 'www.9jasub.com', 'acme.9jasub.com', 'evil.acme.9jasub.com', 'mk-subdata.com']) {
            expect(() => normalizeDomain(d)).toThrow(/platform/);
        }
    });

    test('honours DOMAIN_RESERVED from the environment', () => {
        process.env.DOMAIN_RESERVED = 'otherapp.com';
        try {
            expect(() => normalizeDomain('api.otherapp.com')).toThrow(/platform/);
            expect(normalizeDomain('nototherapp.com')).toBe('nototherapp.com');
        } finally {
            delete process.env.DOMAIN_RESERVED;
        }
    });
});

test('defaultIncludeWww: only for a registrable apex', () => {
    expect(defaultIncludeWww('mybusiness.com')).toBe(true);
    expect(defaultIncludeWww('mybusiness.com.ng')).toBe(true);
    expect(defaultIncludeWww('shop.mybusiness.com')).toBe(false);
});

describe('platformSubdomainOf (tenant routing key)', () => {
    test('matches only <label>.<platform base>', () => {
        expect(platformSubdomainOf('acme.9jasub.com')).toBe('acme');
        expect(platformSubdomainOf('acme.mk-subdata.com')).toBe('acme');
        expect(platformSubdomainOf('acme.localhost')).toBe('acme');
    });
    test('never treats a foreign host as a platform subdomain', () => {
        expect(platformSubdomainOf('acme.attacker.com')).toBeNull();
        expect(platformSubdomainOf('acme.9jasub.com.attacker.com')).toBeNull();
        expect(platformSubdomainOf('a.b.9jasub.com')).toBeNull();
        expect(platformSubdomainOf('9jasub.com')).toBeNull();
        expect(platformSubdomainOf('evil9jasub.com')).toBeNull();
    });
});

test('normalizeSubdomainLabel', () => {
    expect(normalizeSubdomainLabel('My-Shop1')).toBe('my-shop1');
    expect(() => normalizeSubdomainLabel('ab')).toThrow();
    expect(() => normalizeSubdomainLabel('admin')).toThrow(/reserved/);
    expect(() => normalizeSubdomainLabel('a.b')).toThrow();
});
