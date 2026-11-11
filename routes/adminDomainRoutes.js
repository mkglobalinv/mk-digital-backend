import express from "express";
import CustomDomainRequest from "../models/CustomDomainRequest.js";
import User from "../models/User.js";
import { DomainValidationError } from "../services/domains/domainValidation.js";
import { runDomainHelper } from "../services/domains/vpsProvisioner.js";
import {
    createDomain, generatePlatformSubdomain, retryVerification, retrySsl, checkNow,
    suspendDomain, resumeDomain, removeDomain, resolveDisconnect, serializeDomain, getPublicDomainConfig
} from "../services/domains/vpsDomainService.js";

// Admin -> Domains (self-hosted VPS custom domains). Mounted under
// /api/admin/domains behind adminAuth + requireOwner (routes/adminRoutes.js).
const router = express.Router();

const STATUS_FOR_CODE = { NOT_FOUND: 404, DOMAIN_TAKEN: 409, RESELLER_HAS_DOMAIN: 409, INVALID_STATE: 409 };

const handle = (fn) => async (req, res) => {
    try {
        res.json(await fn(req, res));
    } catch (err) {
        if (err instanceof DomainValidationError) {
            return res.status(STATUS_FOR_CODE[err.code] || 400).json({ message: err.message, code: err.code });
        }
        console.error("[Admin Domains]", err);
        res.status(500).json({ message: "Domain operation failed: " + err.message });
    }
};

const populated = (id) => CustomDomainRequest.findById(id).populate("resellerId", "name email subdomain");

const GROUPS = {
    connected: ["active", "ssl_renewal_required"],
    pending: ["pending_dns", "verifying", "pending_ssl"],
    failed: ["failed", "suspended"]
};

router.get("/config", handle(async () => getPublicDomainConfig()));

router.get("/", handle(async (req) => {
    const filter = { provider: "vps" };
    if (GROUPS[req.query.group]) filter.domainState = { $in: GROUPS[req.query.group] };
    if (req.query.q) filter.domainName = { $regex: String(req.query.q).replace(/[^a-z0-9.-]/gi, ""), $options: "i" };
    const [docs, counts, requests] = await Promise.all([
        CustomDomainRequest.find(filter).populate("resellerId", "name email subdomain").sort({ updatedAt: -1 }).limit(500),
        CustomDomainRequest.aggregate([{ $match: { provider: "vps" } }, { $group: { _id: "$domainState", n: { $sum: 1 } } }]),
        // Reseller-submitted requests (existing flow) not yet set up on the VPS.
        CustomDomainRequest.find({ provider: { $ne: "vps" }, domainOption: "custom_domain", status: { $ne: "Connected Successfully" } })
            .populate("resellerId", "name email subdomain").sort({ createdAt: -1 }).limit(200)
    ]);
    const byState = Object.fromEntries(counts.map((c) => [c._id, c.n]));
    const sum = (states) => states.reduce((n, s) => n + (byState[s] || 0), 0);
    return {
        domains: docs.map((d) => serializeDomain(d)),
        counts: { connected: sum(GROUPS.connected), pending: sum(GROUPS.pending), failed: sum(GROUPS.failed), byState },
        resellerRequests: requests.map((r) => ({
            id: String(r._id), domain: r.domainName, status: r.status, createdAt: r.createdAt,
            reseller: r.resellerId ? { id: String(r.resellerId._id), name: r.resellerId.name, email: r.resellerId.email } : null
        }))
    };
}));

router.get("/resellers", handle(async (req) => {
    const q = String(req.query.q || "").trim().slice(0, 60);
    const filter = { role: "reseller_admin" };
    if (q) {
        const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
        filter.$or = [{ name: rx }, { email: rx }, { subdomain: rx }];
    }
    const users = await User.find(filter).select("name email subdomain customDomain").sort({ name: 1 }).limit(25);
    const withDomain = new Set((await CustomDomainRequest.find({ provider: "vps", resellerId: { $in: users.map((u) => u._id) } }).select("resellerId")).map((d) => String(d.resellerId)));
    return users.map((u) => ({ id: String(u._id), name: u.name, email: u.email, subdomain: u.subdomain || null, hasCustomDomain: withDomain.has(String(u._id)) }));
}));

router.get("/system-check", handle(async () => runDomainHelper("check")));

router.post("/generate", handle(async (req) => generatePlatformSubdomain({ resellerId: req.body.resellerId, label: req.body.subdomain })));

router.post("/", handle(async (req) => {
    const doc = await createDomain({ resellerId: req.body.resellerId, domain: req.body.domain, includeWww: req.body.includeWww, adminId: req.user?._id || req.user?.id });
    // Kick off the first DNS check immediately instead of waiting for the monitor.
    const checked = await checkNow(doc._id);
    return { domain: serializeDomain(await populated(checked._id)) };
}));

router.get("/:id", handle(async (req) => {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) throw new DomainValidationError("Invalid domain id.", "NOT_FOUND");
    const doc = await CustomDomainRequest.findOne({ _id: req.params.id, provider: "vps" }).populate("resellerId", "name email subdomain");
    if (!doc) throw new DomainValidationError("Domain not found.", "NOT_FOUND");
    return { domain: serializeDomain(doc) };
}));

const action = (fn) => handle(async (req) => {
    const result = await fn(req);
    if (result?.removed) return result;
    return { domain: serializeDomain(await populated(result._id)) };
});

router.post("/:id/check", action((req) => checkNow(req.params.id)));
router.post("/:id/retry", action((req) => retryVerification(req.params.id)));
router.post("/:id/retry-ssl", action((req) => retrySsl(req.params.id)));
router.post("/:id/suspend", action((req) => suspendDomain(req.params.id, req.body?.reason)));
router.post("/:id/resume", action((req) => resumeDomain(req.params.id)));
router.post("/:id/disconnect/approve", action((req) => resolveDisconnect(req.params.id, true)));
router.post("/:id/disconnect/reject", action((req) => resolveDisconnect(req.params.id, false)));
router.delete("/:id", handle(async (req) => removeDomain(req.params.id)));

export default router;
