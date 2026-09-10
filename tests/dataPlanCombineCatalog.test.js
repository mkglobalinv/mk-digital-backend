// Covers the "combine catalog" matching logic used by POST /data-plans/sync
// (routes/adminRoutes.js) to decide whether an Ogdams MTN Data Gifting plan
// and an existing MTN Gifting-category plan from another provider (e.g.
// Peyflex) represent the exact same customer-facing bundle -- same data
// volume + same validity -- and should therefore be combined into one
// customer-facing plan (the non-Ogdams duplicate deactivated) rather than
// shown twice. Pure-function unit tests only; no DB/HTTP involved, so no
// mongodb-memory-server harness is needed.
import { dataPlanMatchKey, parseDataSizeToMB, parseValidityToDays } from '../routes/adminRoutes.js';

describe('parseDataSizeToMB', () => {
    test('parses MB, GB, TB (case-insensitive) and converts GB/TB to MB', () => {
        expect(parseDataSizeToMB('75MB')).toBe(75);
        expect(parseDataSizeToMB('1gb')).toBe(1000);
        expect(parseDataSizeToMB('2.5GB')).toBe(2500);
        expect(parseDataSizeToMB('11GB')).toBe(11000);
        expect(parseDataSizeToMB('1TB')).toBe(1000000);
    });

    test('returns null when no recognizable size is present', () => {
        expect(parseDataSizeToMB('')).toBeNull();
        expect(parseDataSizeToMB(undefined)).toBeNull();
        expect(parseDataSizeToMB('Unlimited')).toBeNull();
    });
});

describe('parseValidityToDays', () => {
    test('parses explicit day counts', () => {
        expect(parseValidityToDays('1 Day')).toBe(1);
        expect(parseValidityToDays('2 Days')).toBe(2);
        expect(parseValidityToDays('7 Days')).toBe(7);
        expect(parseValidityToDays('30 days')).toBe(30);
    });

    test('parses common named validities', () => {
        expect(parseValidityToDays('Daily')).toBe(1);
        expect(parseValidityToDays('Weekly')).toBe(7);
        expect(parseValidityToDays('Monthly')).toBe(30);
    });

    test('returns null for unrecognized validity text -- an ambiguous plan must never silently match', () => {
        expect(parseValidityToDays('')).toBeNull();
        expect(parseValidityToDays(undefined)).toBeNull();
        expect(parseValidityToDays('N/A')).toBeNull();
    });
});

describe('dataPlanMatchKey -- the exact data-volume + validity match used to combine catalog duplicates', () => {
    test('two plans with the same size and validity produce the same key', () => {
        expect(dataPlanMatchKey('2GB', '2 Days')).toBe(dataPlanMatchKey('2GB', '2 Days'));
        expect(dataPlanMatchKey('1GB', '7 Days')).toBe(dataPlanMatchKey('1GB', '7 Days'));
    });

    test('matches a confirmed Ogdams plan against an equivalent Peyflex-style Gifting plan', () => {
        // Ogdams plan 20006 (2GB - 2 Days) vs. an existing Peyflex MTN Gifting
        // plan whose validity was scraped from a "(...)" label as "2 Days".
        expect(dataPlanMatchKey('2GB', '2 Days')).toBe(dataPlanMatchKey('2GB', '2 Days'));
        expect(dataPlanMatchKey('11GB', '7 Days')).toEqual(dataPlanMatchKey('11GB', '7 Days'));
    });

    test('different data volume never matches, even with identical validity', () => {
        expect(dataPlanMatchKey('2GB', '2 Days')).not.toBe(dataPlanMatchKey('2.5GB', '2 Days'));
    });

    test('different validity never matches, even with identical data volume', () => {
        expect(dataPlanMatchKey('1GB', '1 Day')).not.toBe(dataPlanMatchKey('1GB', '7 Days'));
    });

    test('returns null (never a match) when either side cannot be confidently parsed -- ambiguous plans stay separate, per "keep unmatched plans unchanged"', () => {
        expect(dataPlanMatchKey('Unlimited', '2 Days')).toBeNull();
        expect(dataPlanMatchKey('2GB', 'N/A')).toBeNull();
        expect(dataPlanMatchKey(undefined, undefined)).toBeNull();
    });
});
