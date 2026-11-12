// AES-256-GCM encryption of stored integration credentials.
import crypto from 'crypto';
import { encryptValue, decryptValue, getMasterKey, keyId } from '../../services/settings/secretCrypto.js';

const HEX = crypto.randomBytes(32).toString('hex');

beforeEach(() => { process.env.SETTINGS_ENCRYPTION_KEY = HEX; });
afterAll(() => { delete process.env.SETTINGS_ENCRYPTION_KEY; });

test('round-trips and never contains the plaintext', () => {
    const enc = encryptValue('FLW_SECRET_KEY', 'FLWSECK-abcdef1234567890-X');
    expect(JSON.stringify(enc)).not.toContain('FLWSECK');
    expect(enc).toMatchObject({ v: 1, kid: keyId(getMasterKey()) });
    expect(decryptValue('FLW_SECRET_KEY', enc)).toBe('FLWSECK-abcdef1234567890-X');
});

test('uses a fresh IV every time', () => {
    const a = encryptValue('K', 'same');
    const b = encryptValue('K', 'same');
    expect(a.iv).not.toBe(b.iv);
    expect(a.ct).not.toBe(b.ct);
});

test('detects tampering (authenticated encryption)', () => {
    const enc = encryptValue('K', 'secret-value');
    const ct = Buffer.from(enc.ct, 'base64'); ct[0] ^= 1;
    expect(() => decryptValue('K', { ...enc, ct: ct.toString('base64') })).toThrow();
    const tag = Buffer.from(enc.tag, 'base64'); tag[0] ^= 1;
    expect(() => decryptValue('K', { ...enc, tag: tag.toString('base64') })).toThrow();
});

test('a ciphertext cannot be moved to another setting (AAD binding)', () => {
    const enc = encryptValue('PAYSTACK_SECRET_KEY', 'sk_live_x');
    expect(() => decryptValue('FLW_SECRET_KEY', enc)).toThrow();
});

test('a different master key cannot decrypt', () => {
    const enc = encryptValue('K', 'secret');
    process.env.SETTINGS_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
    expect(() => decryptValue('K', enc)).toThrow(/different SETTINGS_ENCRYPTION_KEY/);
    delete enc.kid; // even without the key-id shortcut, GCM rejects it
    expect(() => decryptValue('K', enc)).toThrow();
});

test('key formats: 64 hex or base64 of 32 bytes; other lengths rejected; unset = null', () => {
    process.env.SETTINGS_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
    expect(getMasterKey()).toHaveLength(32);
    process.env.SETTINGS_ENCRYPTION_KEY = 'too-short';
    expect(() => getMasterKey()).toThrow(/32 bytes/);
    delete process.env.SETTINGS_ENCRYPTION_KEY;
    expect(getMasterKey()).toBeNull();
    expect(() => encryptValue('K', 'x')).toThrow(/not set/);
});
