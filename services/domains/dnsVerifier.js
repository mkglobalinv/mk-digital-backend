import { promises as dnsPromises } from "dns";

// Checks a reseller domain's public DNS against our VPS. Queries public
// resolvers directly (not the VPS's own resolver/cache) and requires every
// resolver to agree before a domain is treated as verified, so we never ask
// Let's Encrypt to validate a domain that has only half-propagated.

export const TXT_RECORD_PREFIX = "_9jasub-verify";

export const txtRecordName = (domain) => `${TXT_RECORD_PREFIX}.${domain}`;
export const txtRecordValue = (token) => `9jasub-verify=${token}`;

export const getDnsConfig = () => ({
    ipv4: (process.env.VPS_PUBLIC_IPV4 || "").trim(),
    ipv6: (process.env.VPS_PUBLIC_IPV6 || "").trim().toLowerCase(),
    resolvers: (process.env.DNS_RESOLVERS || "1.1.1.1,8.8.8.8").split(",").map((s) => s.trim()).filter(Boolean),
    requireTxt: process.env.DOMAIN_REQUIRE_TXT_VERIFICATION !== "false"
});

/** The records a reseller must create at their registrar. */
export function requiredDnsRecords({ domain, includeWww, verificationToken }) {
    const { ipv4, requireTxt } = getDnsConfig();
    const records = [{ type: "A", host: "@", name: domain, value: ipv4 || "(VPS_PUBLIC_IPV4 not configured)", purpose: "Points your domain to the 9jaSub server" }];
    if (includeWww) records.push({ type: "A", host: "www", name: `www.${domain}`, value: ipv4 || "(VPS_PUBLIC_IPV4 not configured)", purpose: "Points www to the 9jaSub server" });
    if (requireTxt && verificationToken) {
        records.push({ type: "TXT", host: TXT_RECORD_PREFIX, name: txtRecordName(domain), value: txtRecordValue(verificationToken), purpose: "Proves you own this domain" });
    }
    return records;
}

const NO_RECORD_CODES = new Set(["ENODATA", "ENOTFOUND", "NXDOMAIN", "ENONAME"]);

async function lookup(resolver, method, name) {
    try {
        return { records: await resolver[method](name) };
    } catch (err) {
        if (NO_RECORD_CODES.has(err.code)) return { records: [] };
        return { records: [], error: err.code || err.message };
    }
}

const createResolver = (server) => {
    const r = new dnsPromises.Resolver({ timeout: 5000, tries: 2 });
    r.setServers([server]);
    return r;
};

async function checkWithResolver(resolver, { domain, includeWww, verificationToken }, cfg) {
    const problems = [];
    const [apexA, wwwA, apexAAAA, wwwAAAA, txt] = await Promise.all([
        lookup(resolver, "resolve4", domain),
        includeWww ? lookup(resolver, "resolve4", `www.${domain}`) : Promise.resolve({ records: [] }),
        lookup(resolver, "resolve6", domain),
        includeWww ? lookup(resolver, "resolve6", `www.${domain}`) : Promise.resolve({ records: [] }),
        cfg.requireTxt ? lookup(resolver, "resolveTxt", txtRecordName(domain)) : Promise.resolve({ records: [] })
    ]);

    const pointsHere = (res) => res.records.length > 0 && res.records.every((ip) => ip === cfg.ipv4);
    const describe = (res) => (res.error ? `lookup failed (${res.error})` : res.records.length ? res.records.join(", ") : "no A record");

    const apexOk = pointsHere(apexA);
    if (!apexOk) problems.push(`${domain} must have an A record pointing only to ${cfg.ipv4} (found: ${describe(apexA)}).`);
    const wwwOk = !includeWww || pointsHere(wwwA);
    if (!wwwOk) problems.push(`www.${domain} must have an A record pointing only to ${cfg.ipv4} (found: ${describe(wwwA)}).`);

    // An AAAA record elsewhere makes Let's Encrypt (which prefers IPv6) and
    // IPv6 visitors reach a different server.
    const v6 = [...apexAAAA.records, ...wwwAAAA.records].map((ip) => ip.toLowerCase());
    const ipv6Ok = v6.every((ip) => cfg.ipv6 && ip === cfg.ipv6);
    if (!ipv6Ok) problems.push(`Remove the AAAA (IPv6) record(s) ${v6.join(", ")}: they point away from the 9jaSub server.`);

    let txtOk = true;
    if (cfg.requireTxt) {
        const expected = txtRecordValue(verificationToken);
        const values = txt.records.map((chunks) => chunks.join(""));
        txtOk = values.includes(expected);
        if (!txtOk) problems.push(`Add a TXT record at ${txtRecordName(domain)} with value ${expected}.`);
    }

    return { apexOk, wwwOk, ipv6Ok, txtOk, apexRecords: apexA.records, wwwRecords: wwwA.records, problems };
}

/**
 * Returns { ok, apexOk, wwwOk, txtOk, ipv6Ok, apexRecords, wwwRecords, message }.
 * ok is true only when every configured public resolver sees correct records.
 * `resolverFactory` is injectable for tests.
 */
export async function checkDomainDns({ domain, includeWww, verificationToken }, { resolverFactory = createResolver } = {}) {
    const cfg = getDnsConfig();
    if (!cfg.ipv4) {
        return { ok: false, apexOk: false, wwwOk: false, txtOk: false, ipv6Ok: false, apexRecords: [], wwwRecords: [], message: "VPS_PUBLIC_IPV4 is not configured on the server." };
    }
    const results = await Promise.all(cfg.resolvers.map((server) => checkWithResolver(resolverFactory(server), { domain, includeWww, verificationToken }, cfg)));
    const all = (key) => results.every((r) => r[key]);
    const ok = all("apexOk") && all("wwwOk") && all("ipv6Ok") && all("txtOk");
    const problems = [...new Set(results.flatMap((r) => r.problems))];
    const partial = !ok && results.some((r) => r.problems.length === 0);
    return {
        ok,
        apexOk: all("apexOk"),
        wwwOk: all("wwwOk"),
        txtOk: all("txtOk"),
        ipv6Ok: all("ipv6Ok"),
        apexRecords: results[0]?.apexRecords || [],
        wwwRecords: results[0]?.wwwRecords || [],
        message: ok ? "DNS records are correct." : (partial ? "DNS is still propagating: some public resolvers do not see the new records yet. " : "") + problems.join(" ")
    };
}
