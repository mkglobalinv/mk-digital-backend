import CustomDomainRequest from "../models/CustomDomainRequest.js";
import { DomainValidationError } from "../services/domains/domainValidation.js";
import { serializeDomain, requestDisconnect, getPublicDomainConfig } from "../services/domains/vpsDomainService.js";

// Reseller view of their own custom domain. Always scoped to req.user.id:
// a reseller can never read or act on another reseller's domain record.

export const getCustomDomainStatus = async (req, res) => {
    try {
        const doc = await CustomDomainRequest.findOne({ provider: "vps", resellerId: req.user.id });
        const config = getPublicDomainConfig();
        res.json({
            domain: doc ? serializeDomain(doc, { forReseller: true }) : null,
            allowDisconnectRequests: config.allowDisconnectRequests,
            platformBaseDomain: config.platformBaseDomains[0]
        });
    } catch (err) {
        console.error("[Reseller Domain]", err);
        res.status(500).json({ message: "Could not load your domain status." });
    }
};

export const requestCustomDomainDisconnect = async (req, res) => {
    try {
        const doc = await requestDisconnect(req.user.id, req.body?.reason);
        res.json({ message: "Disconnection requested. The administrator will review it.", domain: serializeDomain(doc, { forReseller: true }) });
    } catch (err) {
        if (err instanceof DomainValidationError) return res.status(err.code === "NOT_FOUND" ? 404 : 400).json({ message: err.message });
        console.error("[Reseller Domain]", err);
        res.status(500).json({ message: "Could not submit the request." });
    }
};
