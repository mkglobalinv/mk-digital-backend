// Migration for VPS custom domain management (services/domains/*).
//
//   node scripts/migrations/2026-11-vps-custom-domains.js              # dry run: report only
//   node scripts/migrations/2026-11-vps-custom-domains.js --apply      # create indexes
//   node scripts/migrations/2026-11-vps-custom-domains.js --apply --import-legacy
//
// --apply          creates the new indexes on customdomainrequests:
//                  one VPS record per domain, one VPS domain per reseller.
// --import-legacy  for every reseller that already has User.customDomain set
//                  (connected in the Railway era) and no VPS record, creates a
//                  VPS record in pending_dns, so the domain is verified and gets
//                  a Let's Encrypt certificate once its DNS points to the VPS.
//                  Routing (User.customDomain) is left exactly as it is.
//
// Additive only: existing fields and documents are never modified or deleted.
// --link-host host=subdomain
//                  for a custom domain that was connected before customDomain
//                  was stored (it resolved only because its first label equals
//                  the reseller's subdomain, e.g. midataplus.com), sets that
//                  reseller's User.customDomain = host. After linking, remove
//                  the host from LEGACY_HOST_SUBDOMAIN_FALLBACK.
//
// Rollback: node scripts/migrations/2026-11-vps-custom-domains.js --rollback
// drops the two new indexes and deletes VPS records created by --import-legacy.
import crypto from "crypto";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const argv = process.argv.slice(2);
const args = new Set(argv);
// --link-host midataplus.com=midataplus  (repeatable)
const LINKS = argv.flatMap((a, i) => (a === "--link-host" && argv[i + 1] ? [argv[i + 1]] : []));
const APPLY = args.has("--apply");
const IMPORT = args.has("--import-legacy");
const ROLLBACK = args.has("--rollback");

const { default: User } = await import("../../models/User.js");
const { default: CustomDomainRequest } = await import("../../models/CustomDomainRequest.js");
const { normalizeDomain, defaultIncludeWww } = await import("../../services/domains/domainValidation.js");

const log = (...a) => console.log("[migration]", ...a);

async function main() {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set.");
    await mongoose.connect(process.env.MONGO_URI);
    const col = CustomDomainRequest.collection;

    if (ROLLBACK) {
        for (const name of ["vps_domain_unique", "vps_reseller_unique"]) {
            try { await col.dropIndex(name); log(`dropped index ${name}`); } catch (e) { log(`index ${name}: ${e.codeName || e.message}`); }
        }
        const res = await CustomDomainRequest.deleteMany({ provider: "vps", "metaData.importedBy": "2026-11-vps-custom-domains" });
        log(`deleted ${res.deletedCount} imported VPS record(s). Records created by admins are kept.`);
        return;
    }

    // 1. Anything that would make the unique indexes fail.
    const dupDomains = await CustomDomainRequest.aggregate([{ $match: { provider: "vps" } }, { $group: { _id: "$domainName", n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]);
    const dupResellers = await CustomDomainRequest.aggregate([{ $match: { provider: "vps" } }, { $group: { _id: "$resellerId", n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]);
    if (dupDomains.length || dupResellers.length) {
        log("BLOCKED: duplicate VPS records must be resolved first:", JSON.stringify({ dupDomains, dupResellers }));
        process.exitCode = 1;
        return;
    }

    // 2. Report current routing state.
    const routed = await User.find({ customDomain: { $exists: true, $nin: [null, ""] } }).select("_id name email role customDomain").lean();
    const vpsByReseller = new Map((await CustomDomainRequest.find({ provider: "vps" }).select("resellerId domainName").lean()).map((d) => [String(d.resellerId), d.domainName]));
    log(`${routed.length} account(s) currently have a customDomain (routing key):`);
    const importable = [];
    for (const u of routed) {
        let normalized = null;
        let problem = null;
        try { normalized = normalizeDomain(u.customDomain); } catch (e) { problem = e.message; }
        const status = vpsByReseller.has(String(u._id)) ? `managed (${vpsByReseller.get(String(u._id))})`
            : problem ? `INVALID: ${problem}`
            : u.role !== "reseller_admin" ? `skipped: role ${u.role}`
            : "legacy (not managed)";
        log(`  - ${u.customDomain}  ->  ${u.email}  [${status}]`);
        if (status === "legacy (not managed)") importable.push({ user: u, domain: normalized });
    }
    const verified = new Set((await CustomDomainRequest.find({ status: "Connected Successfully", domainOption: "custom_domain" }).select("domainName").lean())
        .map((r) => r.domainName.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "")));
    const unverified = routed.filter((u) => !verified.has(u.customDomain.replace(/^www\./, "")) && !vpsByReseller.has(String(u._id)));
    if (unverified.length) {
        log(`NOTE: ${unverified.length} customDomain value(s) were never marked connected. Before this release a reseller's domain request set customDomain immediately; review these (importing them puts them through verification):`);
        unverified.forEach((u) => log(`  - ${u.customDomain} (${u.email})`));
    }

    if (!APPLY) {
        log("Dry run complete. Re-run with --apply (and optionally --import-legacy).");
        return;
    }

    // 3. Indexes (idempotent).
    await CustomDomainRequest.syncIndexes();
    log("indexes synced on customdomainrequests:", (await col.indexes()).map((i) => i.name).join(", "));

    // 4. Link legacy hosts that only resolved through the first-label fallback.
    for (const pair of LINKS) {
        const [rawHost, sub] = pair.split("=");
        let host;
        try { host = normalizeDomain(rawHost); } catch (e) { log(`  link ${pair}: ${e.message}`); continue; }
        const reseller = await User.findOne({ subdomain: String(sub || "").toLowerCase(), role: "reseller_admin" });
        if (!reseller) { log(`  link ${pair}: no reseller with subdomain "${sub}"`); continue; }
        const other = await User.findOne({ customDomain: { $in: [host, `www.${host}`] }, _id: { $ne: reseller._id } }).select("email");
        if (other) { log(`  link ${pair}: ${host} already belongs to ${other.email}; skipped`); continue; }
        if (reseller.customDomain && reseller.customDomain !== host) { log(`  link ${pair}: reseller already has customDomain ${reseller.customDomain}; skipped`); continue; }
        await User.updateOne({ _id: reseller._id }, { $set: { customDomain: host } });
        log(`  linked ${host} -> ${reseller.email} (subdomain ${reseller.subdomain})`);
        importable.push({ user: { ...reseller.toObject(), customDomain: host }, domain: host });
    }

    // 5. Optional import of legacy domains into the managed lifecycle.
    if (IMPORT) {
        let created = 0;
        for (const { user, domain } of importable) {
            const doc = new CustomDomainRequest({
                resellerId: user._id,
                domainOption: "custom_domain",
                domainName: domain,
                provider: "vps",
                includeWww: defaultIncludeWww(domain),
                verificationToken: crypto.randomBytes(16).toString("hex"),
                domainState: "pending_dns",
                stateSince: new Date(),
                status: "Domain Verification",
                lifecycleStatus: "pending_dns",
                metaData: { importedBy: "2026-11-vps-custom-domains" },
                history: [{ at: new Date(), state: "pending_dns", message: "Imported from legacy customDomain; routing unchanged until verified." }]
            });
            try { await doc.save(); created++; log(`  imported ${domain}`); } catch (e) { log(`  could not import ${domain}: ${e.message}`); }
        }
        log(`imported ${created} legacy domain(s). Give each reseller the DNS records from Admin -> Domains (including the TXT record).`);
    }
}

main()
    .catch((err) => { console.error("[migration] FAILED:", err); process.exitCode = 1; })
    .finally(async () => {
        await mongoose.disconnect();
        // Imported models start background clients (email, Supabase); exit explicitly.
        process.exit(process.exitCode || 0);
    });
