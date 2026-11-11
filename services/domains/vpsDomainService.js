import crypto from "crypto";
import http from "http";
import https from "https";
import CustomDomainRequest from "../../models/CustomDomainRequest.js";
import User from "../../models/User.js";
import Notification from "../../models/Notification.js";
import { sendEmail } from "../emailService.js";
import { clearResellerCache } from "../../middlewares/whiteLabel.js";
import { normalizeDomain, defaultIncludeWww, normalizeSubdomainLabel, getPlatformBaseDomains, DomainValidationError } from "./domainValidation.js";
import { checkDomainDns, requiredDnsRecords, getDnsConfig } from "./dnsVerifier.js";
import { runDomainHelper, parseCertDate } from "./vpsProvisioner.js";

// Lifecycle for reseller custom domains served from our own VPS:
//
//   pending_dns --DNS + ownership TXT correct--> verifying
//   verifying   --nginx prepared, http probe ok--> pending_ssl
//   pending_ssl --Let's Encrypt issued, https probe ok--> active
//   active      --cert within SSL_RENEW_ALERT_DAYS of expiry--> ssl_renewal_required
//   any         --admin--> suspended / failed --admin retry--> pending_dns
//
// User.customDomain (the tenant-routing key) is written ONLY on the
// transition to active, and cleared on suspend/remove.

const cfg = () => ({
    dnsTimeoutHours: parseInt(process.env.DOMAIN_DNS_TIMEOUT_HOURS, 10) || 72,
    dnsRecheckSec: parseInt(process.env.DOMAIN_DNS_CHECK_INTERVAL_SEC, 10) || 120,
    sslMaxAttempts: parseInt(process.env.SSL_MAX_ATTEMPTS, 10) || 5,
    sslBaseBackoffMin: parseInt(process.env.SSL_RETRY_BASE_MINUTES, 10) || 15,
    acmeMaxPerHour: parseInt(process.env.ACME_MAX_ISSUANCES_PER_HOUR, 10) || 10,
    renewAlertDays: parseInt(process.env.SSL_RENEW_ALERT_DAYS, 10) || 20,
    activeCheckHours: parseInt(process.env.DOMAIN_ACTIVE_CHECK_HOURS, 10) || 6,
    adminEmail: process.env.ADMIN_EMAIL || "mksubdata@gmail.com",
    allowDisconnectRequests: process.env.DOMAIN_ALLOW_DISCONNECT_REQUESTS !== "false"
});

// ---------------------------------------------------------------------------
// Reachability probes. Both fetch /.well-known/9jasub-probe, which only our
// generated nginx vhost answers (with the domain name), proving public DNS
// reaches THIS server's config for THIS domain.
// ---------------------------------------------------------------------------
function probe(url, { secure }) {
    return new Promise((resolve) => {
        const lib = secure ? https : http;
        const req = lib.get(url, { timeout: 10000, headers: { "User-Agent": "9jasub-domain-probe" } }, (res) => {
            let body = "";
            const cert = secure ? res.socket.getPeerCertificate?.() : null;
            res.setEncoding("utf8");
            res.on("data", (c) => { body += c; if (body.length > 1024) req.destroy(); });
            res.on("end", () => resolve({ ok: true, status: res.statusCode, body: body.trim(), validTo: cert?.valid_to ? new Date(cert.valid_to) : null, issuer: cert?.issuer?.O || cert?.issuer?.CN || null }));
        });
        req.on("timeout", () => req.destroy(new Error("timed out")));
        req.on("error", (err) => resolve({ ok: false, error: err.code || err.message }));
    });
}

const defaultDeps = {
    checkDns: (doc) => checkDomainDns({ domain: doc.domainName, includeWww: doc.includeWww, verificationToken: doc.verificationToken }),
    runHelper: runDomainHelper,
    probeHttp: (host) => probe(`http://${host}/.well-known/9jasub-probe`, { secure: false }),
    probeHttps: (host) => probe(`https://${host}/.well-known/9jasub-probe`, { secure: true }),
    notifyReseller: async (userId, title, message, type = "system") => {
        try { await Notification.create({ userId, title, message, type }); } catch (e) { console.error("[Domains] notify failed:", e.message); }
    },
    alertAdmin: async (subject, text) => {
        try { await sendEmail(cfg().adminEmail, subject, `<p>${text}</p>`); } catch (e) { console.error("[Domains] admin alert failed:", e.message); }
    },
    now: () => new Date()
};
let deps = { ...defaultDeps };
/** Test hook: replace side-effecting dependencies. */
export const __setDeps = (overrides) => { deps = { ...defaultDeps, ...overrides }; };

const LEGACY_STATUS = {
    pending_dns: "Domain Verification",
    verifying: "Domain Verification",
    pending_ssl: "SSL Activation",
    active: "Connected Successfully",
    ssl_renewal_required: "Connected Successfully",
    failed: "Failed / Needs Correction",
    suspended: "Failed / Needs Correction"
};

function setState(doc, state, message) {
    if (doc.domainState !== state) {
        doc.domainState = state;
        doc.stateSince = deps.now();
        doc.history = [...(doc.history || []), { at: deps.now(), state, message: message || "" }].slice(-30);
    }
    // Keep the pre-existing reseller/admin screens (status-based) accurate.
    doc.status = LEGACY_STATUS[state];
    doc.lifecycleStatus = state;
    doc.sslStatus = state === "active" ? "Active" : state === "ssl_renewal_required" ? "Renewal Required" : state === "pending_ssl" ? "Pending" : doc.sslStatus;
    doc.deploymentStatus = state === "active" ? "Completed" : state === "failed" ? "Failed" : "Pending";
}

function resetSslRetries(doc) {
    doc.set("ssl.attempts", 0);
    doc.set("ssl.nextAttemptAt", null);
    doc.set("ssl.lastError", null);
}

const daysUntil = (date) => (date ? (date.getTime() - deps.now().getTime()) / 86400000 : null);
const hostsOf = (doc) => (doc.includeWww ? [doc.domainName, `www.${doc.domainName}`] : [doc.domainName]);

// ---------------------------------------------------------------------------
// Commands (admin / reseller actions)
// ---------------------------------------------------------------------------
export async function createDomain({ resellerId, domain, includeWww, adminId }) {
    const normalized = normalizeDomain(domain);
    const reseller = await User.findById(resellerId).select("_id role customDomain subdomain name email");
    if (!reseller || reseller.role !== "reseller_admin") throw new DomainValidationError("Select a valid reseller account.", "INVALID_RESELLER");

    const otherOwner = await User.findOne({ customDomain: { $in: [normalized, `www.${normalized}`] }, _id: { $ne: reseller._id } }).select("_id");
    if (otherOwner) throw new DomainValidationError("This domain is already connected to another account.", "DOMAIN_TAKEN");
    const existing = await CustomDomainRequest.findOne({ provider: "vps", $or: [{ domainName: normalized }, { resellerId: reseller._id }] });
    if (existing) {
        if (existing.domainName === normalized && String(existing.resellerId) !== String(reseller._id)) {
            throw new DomainValidationError("This domain is already registered to another reseller.", "DOMAIN_TAKEN");
        }
        throw new DomainValidationError(`This reseller already has a custom domain (${existing.domainName}). Remove it first.`, "RESELLER_HAS_DOMAIN");
    }

    const doc = new CustomDomainRequest({
        resellerId: reseller._id,
        domainOption: "custom_domain",
        domainName: normalized,
        provider: "vps",
        includeWww: typeof includeWww === "boolean" ? includeWww : defaultIncludeWww(normalized),
        verificationToken: crypto.randomBytes(16).toString("hex"),
        createdBy: adminId || null
    });
    setState(doc, "pending_dns", "Domain added; waiting for DNS records.");
    try {
        await doc.save();
    } catch (err) {
        if (err.code === 11000) throw new DomainValidationError("This domain or reseller already has a domain registered.", "DOMAIN_TAKEN");
        throw err;
    }
    await deps.notifyReseller(reseller._id, "Custom domain added", `Your custom domain ${normalized} was added. Add the DNS records shown in your Domain page to connect it.`);
    return doc;
}

export async function generatePlatformSubdomain({ resellerId, label }) {
    const reseller = await User.findById(resellerId).select("_id role subdomain");
    if (!reseller || reseller.role !== "reseller_admin") throw new DomainValidationError("Select a valid reseller account.", "INVALID_RESELLER");
    const base = getPlatformBaseDomains()[0];
    if (reseller.subdomain && !label) return { subdomain: reseller.subdomain, url: `https://${reseller.subdomain}.${base}`, created: false };
    const sub = normalizeSubdomainLabel(label || reseller.subdomain);
    const taken = await User.findOne({ $or: [{ subdomain: sub }, { admin_subdomain: sub }], _id: { $ne: reseller._id } }).select("_id");
    if (taken) throw new DomainValidationError("That subdomain is already taken.", "DOMAIN_TAKEN");
    await User.updateOne({ _id: reseller._id }, { $set: { subdomain: sub } });
    clearResellerCache();
    return { subdomain: sub, url: `https://${sub}.${base}`, created: true };
}

async function loadVps(id) {
    if (!/^[0-9a-fA-F]{24}$/.test(String(id))) throw new DomainValidationError("Invalid domain id.", "NOT_FOUND");
    const doc = await CustomDomainRequest.findOne({ _id: id, provider: "vps" });
    if (!doc) throw new DomainValidationError("Domain not found.", "NOT_FOUND");
    return doc;
}

export async function retryVerification(id) {
    const doc = await loadVps(id);
    if (doc.domainState === "suspended") throw new DomainValidationError("Resume the domain instead.", "INVALID_STATE");
    resetSslRetries(doc);
    doc.lastError = null;
    doc.set("dns.lastCheckedAt", null);
    setState(doc, "pending_dns", "Verification restarted by admin.");
    await doc.save();
    return processDomain(doc._id, { force: true });
}

export async function retrySsl(id) {
    const doc = await loadVps(id);
    if (doc.domainState === "ssl_renewal_required" || doc.domainState === "active") {
        const res = await deps.runHelper("renew", doc.domainName, { includeWww: doc.includeWww });
        doc.set("ssl.lastAttemptAt", deps.now());
        doc.set("ssl.lastError", res.ok ? null : res.message);
        doc.set("ssl.lastCheckedAt", null); // re-read expiry on the next step
        await doc.save();
        if (!res.ok) throw new DomainValidationError(res.message, "SSL_FAILED");
        return processDomain(doc._id, { force: true });
    }
    if (!["pending_ssl", "failed"].includes(doc.domainState)) throw new DomainValidationError("SSL can only be retried after DNS is verified.", "INVALID_STATE");
    resetSslRetries(doc);
    setState(doc, doc.dns?.apexOk ? "pending_ssl" : "pending_dns", "SSL retry requested by admin.");
    await doc.save();
    return processDomain(doc._id, { force: true });
}

export async function checkNow(id) {
    const doc = await loadVps(id);
    doc.set("dns.lastCheckedAt", null);
    doc.set("ssl.lastCheckedAt", null);
    doc.set("ssl.nextAttemptAt", null);
    await doc.save();
    return processDomain(doc._id, { force: true });
}

async function detachRouting(doc) {
    await User.updateOne({ _id: doc.resellerId, customDomain: { $in: [doc.domainName, `www.${doc.domainName}`] } }, { $unset: { customDomain: 1 } });
    clearResellerCache();
}

export async function suspendDomain(id, reason) {
    const doc = await loadVps(id);
    await detachRouting(doc);
    doc.lastError = reason ? `Suspended: ${reason}` : "Suspended by admin.";
    setState(doc, "suspended", doc.lastError);
    await doc.save();
    await deps.notifyReseller(doc.resellerId, "Custom domain suspended", `Your custom domain ${doc.domainName} was suspended by the administrator.`, "warning");
    return doc;
}

export async function resumeDomain(id) {
    const doc = await loadVps(id);
    if (doc.domainState !== "suspended") throw new DomainValidationError("Domain is not suspended.", "INVALID_STATE");
    doc.lastError = null;
    doc.set("dns.lastCheckedAt", null);
    setState(doc, "pending_dns", "Resumed by admin; re-verifying.");
    await doc.save();
    return processDomain(doc._id, { force: true });
}

export async function removeDomain(id) {
    const doc = await loadVps(id);
    await detachRouting(doc);
    const res = await deps.runHelper("remove", doc.domainName, { includeWww: doc.includeWww });
    if (!res.ok) throw new DomainValidationError(`Routing was removed, but nginx cleanup failed: ${res.message}`, "REMOVE_FAILED");
    await CustomDomainRequest.deleteOne({ _id: doc._id });
    await deps.notifyReseller(doc.resellerId, "Custom domain removed", `Your custom domain ${doc.domainName} was disconnected.`, "warning");
    return { removed: true, domain: doc.domainName };
}

export async function requestDisconnect(resellerId, reason) {
    if (!cfg().allowDisconnectRequests) throw new DomainValidationError("Disconnection requests are disabled. Contact support.", "NOT_ALLOWED");
    const doc = await CustomDomainRequest.findOne({ provider: "vps", resellerId });
    if (!doc) throw new DomainValidationError("You have no custom domain.", "NOT_FOUND");
    doc.disconnectRequest = { requestedAt: deps.now(), reason: String(reason || "").slice(0, 500), status: "pending" };
    await doc.save();
    await deps.alertAdmin(`Domain disconnect requested: ${doc.domainName}`, `Reseller ${resellerId} asked to disconnect ${doc.domainName}. Reason: ${doc.disconnectRequest.reason || "(none)"}`);
    return doc;
}

export async function resolveDisconnect(id, approve) {
    const doc = await loadVps(id);
    if (doc.disconnectRequest?.status !== "pending") throw new DomainValidationError("No pending disconnect request.", "INVALID_STATE");
    if (approve) return removeDomain(id);
    doc.disconnectRequest.status = "rejected";
    doc.disconnectRequest.resolvedAt = deps.now();
    await doc.save();
    await deps.notifyReseller(doc.resellerId, "Domain disconnect request declined", `Your request to disconnect ${doc.domainName} was declined.`);
    return doc;
}

// ---------------------------------------------------------------------------
// State machine step. Takes a short DB lock so two app instances (or a
// manual "Check now" racing the monitor) never provision the same domain.
// ---------------------------------------------------------------------------
export async function processDomain(id, { force = false } = {}) {
    const now = deps.now();
    const doc = await CustomDomainRequest.findOneAndUpdate(
        { _id: id, provider: "vps", $or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }] },
        { $set: { lockedUntil: new Date(now.getTime() + 10 * 60000) } },
        { new: true }
    );
    if (!doc) return CustomDomainRequest.findById(id); // busy: another worker has it
    try {
        await step(doc, { force });
    } catch (err) {
        console.error(`[Domains] ${doc.domainName} step error:`, err.message);
        doc.lastError = err.message;
    } finally {
        doc.lockedUntil = null;
        await doc.save();
    }
    return doc;
}

async function step(doc, { force }) {
    const c = cfg();
    const now = deps.now();
    switch (doc.domainState) {
        case "pending_dns": {
            if (!force && doc.dns?.lastCheckedAt && now - doc.dns.lastCheckedAt < c.dnsRecheckSec * 1000) return;
            const dns = await deps.checkDns(doc);
            const { ok: _ok, ...dnsFields } = dns;
            doc.dns = { ...dnsFields, lastCheckedAt: now };
            if (dns.ok) {
                doc.lastError = null;
                setState(doc, "verifying", "DNS and ownership verified.");
                return step(doc, { force: true });
            }
            doc.lastError = dns.message;
            const since = doc.stateSince || doc.createdAt || now;
            if (now - since > c.dnsTimeoutHours * 3600000) {
                doc.lastError = `DNS was not configured within ${c.dnsTimeoutHours} hours. ${dns.message}`;
                setState(doc, "failed", doc.lastError);
                await deps.notifyReseller(doc.resellerId, "Custom domain setup failed", `We could not verify DNS for ${doc.domainName}. Check the DNS records and ask the administrator to retry.`, "warning");
            }
            return;
        }
        case "verifying": {
            const prep = await deps.runHelper("prepare", doc.domainName, { includeWww: doc.includeWww });
            if (!prep.ok) {
                doc.lastError = prep.message;
                setState(doc, "failed", `Server setup failed: ${prep.message}`);
                await deps.alertAdmin(`Domain setup failed: ${doc.domainName}`, prep.message);
                return;
            }
            for (const host of hostsOf(doc)) {
                const p = await deps.probeHttp(host);
                if (!p.ok || p.status !== 200 || p.body !== doc.domainName) {
                    // Not a hard failure: DNS caches on the way may still be old.
                    doc.lastError = `http://${host} does not reach this server yet (${p.error || `HTTP ${p.status}`}).`;
                    setState(doc, "pending_dns", doc.lastError);
                    return;
                }
            }
            doc.lastError = null;
            setState(doc, "pending_ssl", "Domain reaches this server; requesting certificate.");
            return step(doc, { force: true });
        }
        case "pending_ssl":
            return stepSsl(doc, { force });
        case "active":
        case "ssl_renewal_required":
            return stepActive(doc, { force });
        default:
            return; // failed / suspended wait for an admin
    }
}

async function stepSsl(doc, { force }) {
    const c = cfg();
    const now = deps.now();

    // A certificate may already exist (issued earlier, only the probe failed):
    // try activating before asking Let's Encrypt again.
    const issuedAlready = doc.ssl.issuedAt && doc.ssl.expiresAt && doc.ssl.expiresAt > now;
    if (!issuedAlready) {
        if (!force && doc.ssl.nextAttemptAt && doc.ssl.nextAttemptAt > now) return;
        const recent = await CustomDomainRequest.countDocuments({ provider: "vps", "ssl.lastAttemptAt": { $gte: new Date(now.getTime() - 3600000) }, _id: { $ne: doc._id } });
        if (recent >= c.acmeMaxPerHour) {
            doc.lastError = "Waiting for the hourly certificate request limit to reset.";
            return;
        }
        doc.ssl.lastAttemptAt = now;
        const res = await deps.runHelper("issue", doc.domainName, { includeWww: doc.includeWww });
        if (!res.ok) {
            const rateLimited = /rate.?limit|too many/i.test(res.message);
            if (!rateLimited) doc.ssl.attempts = (doc.ssl.attempts || 0) + 1;
            doc.ssl.lastError = res.message;
            doc.lastError = res.message;
            const backoffMin = rateLimited ? 24 * 60 : Math.min(12 * 60, c.sslBaseBackoffMin * 2 ** Math.max(0, doc.ssl.attempts - 1));
            doc.ssl.nextAttemptAt = new Date(now.getTime() + backoffMin * 60000);
            if (doc.ssl.attempts >= c.sslMaxAttempts) {
                setState(doc, "failed", `Certificate could not be issued after ${doc.ssl.attempts} attempts: ${res.message}`);
                await deps.alertAdmin(`SSL failed: ${doc.domainName}`, `Let's Encrypt failed ${doc.ssl.attempts} times for ${doc.domainName}: ${res.message}`);
            }
            return;
        }
        doc.ssl.issuedAt = now;
        doc.ssl.expiresAt = parseCertDate(res.notAfter);
        doc.ssl.issuer = res.issuer || null;
        doc.ssl.lastError = null;
        doc.ssl.attempts = 0;
    }

    for (const host of hostsOf(doc)) {
        const p = await deps.probeHttps(host);
        if (!p.ok || p.status !== 200 || p.body !== doc.domainName) {
            doc.lastError = `Certificate is installed but https://${host} is not reachable yet (${p.error || `HTTP ${p.status}`}).`;
            return;
        }
        if (p.validTo) doc.ssl.expiresAt = p.validTo;
    }
    await activate(doc);
}

async function activate(doc) {
    const taken = await User.findOne({ customDomain: { $in: [doc.domainName, `www.${doc.domainName}`] }, _id: { $ne: doc.resellerId } }).select("_id");
    if (taken) {
        doc.lastError = "Another account already uses this domain; not activated.";
        setState(doc, "failed", doc.lastError);
        await deps.alertAdmin(`Domain conflict: ${doc.domainName}`, "Activation blocked because another account already has this domain.");
        return;
    }
    try {
        await User.updateOne({ _id: doc.resellerId }, { $set: { customDomain: doc.domainName } });
    } catch (err) {
        if (err.code === 11000) {
            doc.lastError = "Another account already uses this domain; not activated.";
        setState(doc, "failed", doc.lastError);
            return;
        }
        throw err;
    }
    clearResellerCache();
    doc.activatedAt = deps.now();
    doc.liveUrl = `https://${doc.domainName}`;
    doc.lastError = null;
    doc.ssl.lastCheckedAt = deps.now();
    setState(doc, "active", "HTTPS is live.");
    await deps.notifyReseller(doc.resellerId, "Your website is live", `https://${doc.domainName} is now connected and secured with HTTPS.`, "success");
}

async function stepActive(doc, { force }) {
    const c = cfg();
    const now = deps.now();
    if (!force && doc.ssl.lastCheckedAt && now - doc.ssl.lastCheckedAt < c.activeCheckHours * 3600000) return;
    doc.ssl.lastCheckedAt = now;

    // Prefer the certificate actually served; fall back to the file on disk.
    const p = await deps.probeHttps(doc.domainName);
    if (p.ok && p.validTo) {
        doc.ssl.expiresAt = p.validTo;
        doc.lastError = null;
    } else {
        const info = await deps.runHelper("cert-info", doc.domainName, { includeWww: doc.includeWww });
        if (info.ok) doc.ssl.expiresAt = parseCertDate(info.notAfter) || doc.ssl.expiresAt;
        doc.lastError = `HTTPS check failed (${p.error || `HTTP ${p.status}`}); DNS may have been changed away from this server.`;
    }

    const left = daysUntil(doc.ssl.expiresAt);
    if (left !== null && left < c.renewAlertDays) {
        if (doc.domainState !== "ssl_renewal_required") setState(doc, "ssl_renewal_required", `Certificate expires in ${Math.max(0, Math.floor(left))} days and has not been renewed.`);
        const lastAlert = doc.ssl.renewAlertSentAt;
        if (!lastAlert || now - lastAlert > 24 * 3600000) {
            doc.ssl.renewAlertSentAt = now;
            await deps.alertAdmin(`SSL renewal needed: ${doc.domainName}`, `The certificate for ${doc.domainName} expires on ${doc.ssl.expiresAt?.toUTCString()} and automatic renewal has not replaced it. Use "Retry SSL" in Admin -> Domains or run: sudo certbot renew --cert-name ${doc.domainName}`);
        }
    } else if (doc.domainState === "ssl_renewal_required" && left !== null) {
        setState(doc, "active", "Certificate renewed.");
    }
}

/** Monitor entry point: advances every VPS domain that has work to do. */
export async function tick({ limit = 20 } = {}) {
    const docs = await CustomDomainRequest.find({ provider: "vps", domainState: { $in: ["pending_dns", "verifying", "pending_ssl", "active", "ssl_renewal_required"] } })
        .sort({ updatedAt: 1 }).limit(limit).select("_id");
    for (const { _id } of docs) {
        await processDomain(_id);
    }
    return docs.length;
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------
export function serializeDomain(doc, { forReseller = false } = {}) {
    const d = doc.toObject ? doc.toObject() : doc;
    const view = {
        id: String(d._id),
        domain: d.domainName,
        includeWww: d.includeWww,
        state: d.domainState,
        stateSince: d.stateSince,
        lastError: d.lastError || null,
        dns: d.dns || {},
        ssl: {
            expiresAt: d.ssl?.expiresAt || null,
            issuedAt: d.ssl?.issuedAt || null,
            issuer: d.ssl?.issuer || null,
            attempts: d.ssl?.attempts || 0,
            nextAttemptAt: d.ssl?.nextAttemptAt || null,
            lastError: d.ssl?.lastError || null
        },
        requiredRecords: requiredDnsRecords({ domain: d.domainName, includeWww: d.includeWww, verificationToken: d.verificationToken }),
        liveUrl: ["active", "ssl_renewal_required"].includes(d.domainState) ? `https://${d.domainName}` : null,
        disconnectRequest: d.disconnectRequest?.status ? d.disconnectRequest : null,
        activatedAt: d.activatedAt || null,
        createdAt: d.createdAt
    };
    if (!forReseller) {
        view.reseller = d.resellerId && d.resellerId._id ? { id: String(d.resellerId._id), name: d.resellerId.name, email: d.resellerId.email, subdomain: d.resellerId.subdomain } : { id: String(d.resellerId) };
        view.history = d.history || [];
    }
    return view;
}

export const getPublicDomainConfig = () => {
    const { ipv4, ipv6, requireTxt } = getDnsConfig();
    return { vpsIPv4: ipv4 || null, vpsIPv6: ipv6 || null, requireTxtVerification: requireTxt, platformBaseDomains: getPlatformBaseDomains(), allowDisconnectRequests: cfg().allowDisconnectRequests };
};
