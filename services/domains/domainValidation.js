import net from "net";
import { domainToASCII } from "url";

// Hostname rules for reseller custom domains. Every value that reaches the
// database, the DNS checker or the privileged nginx/certbot helper passes
// through normalizeDomain() first, so this is the single gate for unsafe input.

const LABEL_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const TLD_RE = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

// Never valid on the public internet, or never ours to issue certificates for.
const BLOCKED_SUFFIXES = [
    "localhost", "local", "internal", "intranet", "lan", "home", "corp", "test",
    "invalid", "example", "onion", "arpa", "home.arpa", "railway.internal",
    "up.railway.app", "railway.app", "vercel.app", "netlify.app", "herokuapp.com"
];

// Second-level registries where the registrable domain has three labels
// (e.g. mybusiness.com.ng), used only to decide the default for www.
const TWO_LEVEL_SLDS = new Set(["com", "net", "org", "edu", "gov", "co", "ac", "name", "sch", "mil", "ng", "biz", "mobi", "info"]);

export class DomainValidationError extends Error {
    constructor(message, code = "INVALID_DOMAIN") {
        super(message);
        this.name = "DomainValidationError";
        this.code = code;
    }
}

const splitEnvList = (value) => (value || "").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);

// Base domains that host reseller subdomains (<sub>.9jasub.com). Hosts under
// these are platform hostnames and can never be claimed as a custom domain.
export const getPlatformBaseDomains = () => {
    const fromEnv = splitEnvList(process.env.PLATFORM_BASE_DOMAINS);
    return fromEnv.length ? fromEnv : ["9jasub.com", "mk-subdata.com"];
};

export const getReservedDomains = () => {
    const marketing = splitEnvList(process.env.MARKETING_DOMAINS).map((d) => d.replace(/^www\./, ""));
    return [...new Set([...getPlatformBaseDomains(), ...marketing, ...splitEnvList(process.env.DOMAIN_RESERVED)])];
};

const isUnder = (host, suffix) => host === suffix || host.endsWith(`.${suffix}`);

/**
 * Normalizes user input ("https://WWW.MyBusiness.com/path") to the bare ASCII
 * apex form ("mybusiness.com") and rejects anything unsafe. Throws
 * DomainValidationError with a message suitable for showing to an admin.
 */
export function normalizeDomain(input) {
    if (typeof input !== "string" || !input.trim()) {
        throw new DomainValidationError("Enter a domain name, e.g. mybusiness.com.");
    }
    let host = input.trim().toLowerCase();
    if (/[\s"'`;\\<>{}|^$]/.test(host)) throw new DomainValidationError("The domain contains characters that are not allowed.");
    host = host.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
    if (host.includes("@")) throw new DomainValidationError("Enter only the domain name, without a username.");
    host = host.split(/[/?#]/)[0];
    if (/:\d*$/.test(host)) host = host.replace(/:\d*$/, "");
    host = host.replace(/\.$/, "");
    if (host.includes("*")) throw new DomainValidationError("Wildcard domains are not supported.");
    host = host.replace(/^www\./, "");

    const ascii = domainToASCII(host);
    if (!ascii) throw new DomainValidationError("The domain name is not valid.");
    host = ascii;

    if (net.isIP(host) || /^\[.*\]$/.test(host)) throw new DomainValidationError("Use a domain name, not an IP address.");
    if (host.length > 253) throw new DomainValidationError("The domain name is too long.");

    const labels = host.split(".");
    if (labels.length < 2) throw new DomainValidationError("Enter a full domain, e.g. mybusiness.com.");
    if (!labels.every((l) => LABEL_RE.test(l))) throw new DomainValidationError("The domain name is not valid.");
    if (!TLD_RE.test(labels[labels.length - 1])) throw new DomainValidationError("The domain extension is not valid.");

    if (BLOCKED_SUFFIXES.some((s) => isUnder(host, s))) {
        throw new DomainValidationError("This domain cannot be used for a public website.", "BLOCKED_DOMAIN");
    }
    if (getReservedDomains().some((r) => isUnder(host, r))) {
        throw new DomainValidationError("This domain belongs to the 9jaSub platform and cannot be claimed.", "RESERVED_DOMAIN");
    }
    return host;
}

/** www is added by default only for a registrable apex (mybusiness.com, mybusiness.com.ng). */
export function defaultIncludeWww(domain) {
    const labels = domain.split(".");
    if (labels.length === 2) return true;
    return labels.length === 3 && TWO_LEVEL_SLDS.has(labels[1]);
}

/**
 * Platform subdomain label for "Generate Domain" (<label>.9jasub.com).
 * Lowercase letters, digits and hyphens, 3-40 chars.
 */
export function normalizeSubdomainLabel(input) {
    const label = String(input || "").trim().toLowerCase();
    if (!/^(?!-)[a-z0-9-]{3,40}(?<!-)$/.test(label)) {
        throw new DomainValidationError("Subdomain must be 3-40 characters: letters, numbers and hyphens.");
    }
    const reserved = new Set(["www", "app", "api", "admin", "mail", "smtp", "ftp", "ns1", "ns2", "cdn", "static", "assets", "support", "help", "status", "billing", "secure", "login", "auth", "dashboard"]);
    if (reserved.has(label)) throw new DomainValidationError("That subdomain is reserved.", "RESERVED_DOMAIN");
    return label;
}

/**
 * Tenant lookup key for an incoming Host header. Returns the platform
 * subdomain label only when the host is exactly <label>.<platform base>;
 * any other hostname is treated purely as a custom-domain candidate. This is
 * what stops "acme.attacker.com" from resolving to reseller "acme".
 */
export function platformSubdomainOf(host) {
    for (const base of [...getPlatformBaseDomains(), "localhost"]) {
        if (host.endsWith(`.${base}`)) {
            const rest = host.slice(0, -(base.length + 1));
            if (rest && !rest.includes(".")) return rest;
        }
    }
    return null;
}
