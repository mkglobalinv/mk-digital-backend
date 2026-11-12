import axios from "axios";
import { getSupabaseClient } from "../supabaseClient.js";
import { fetchPeyflexUserProfile } from "../providers/peyflex.js";
import { fetchClubKonnectBalance } from "../providerMonitoringService.js";
import { getSmeplugBalance } from "../providers/smeplug.js";
import { getOgdamsBalances } from "../providers/ogdams.js";
import { getMonnifyToken } from "../monnifyService.js";
import { verifyEmailTransport } from "../emailService.js";
import { runDomainHelper } from "../domains/vpsProvisioner.js";

// "Test Connection" for each integration, using the credentials currently in
// effect. Every test is read-only: a balance/profile lookup, an auth
// handshake or an SMTP login. Nothing is purchased, charged or sent.
// Results are { ok, message }; messages are redacted by the caller.

const httpError = (err) => {
    const status = err.response?.status;
    if (status === 401 || status === 403) return `Rejected credentials (HTTP ${status}).`;
    if (status) return `Provider responded with HTTP ${status}.`;
    if (err.code === "ECONNABORTED") return "Timed out.";
    return `Could not reach the provider (${err.code || "network error"}).`;
};

const TESTS = {
    async supabase() {
        const client = getSupabaseClient();
        if (!client) return { ok: false, message: "Supabase URL or service role key is not set." };
        const bucket = process.env.SUPABASE_BUCKET || "Reseller-app";
        const { error } = await client.storage.getBucket(bucket);
        if (error) return { ok: false, message: `Storage bucket "${bucket}" not reachable: ${error.message}` };
        return { ok: true, message: `Connected; bucket "${bucket}" found.` };
    },
    async peyflex() {
        const r = await fetchPeyflexUserProfile();
        if (!r.success) return { ok: false, message: r.message };
        const bal = r.data?.wallet_credit;
        return { ok: true, message: `Connected${bal !== undefined ? `; wallet ₦${bal}` : ""}.` };
    },
    async clubkonnect() {
        const balance = await fetchClubKonnectBalance();
        return { ok: true, message: `Connected; wallet ₦${balance}.` };
    },
    async smeplug() {
        const r = await getSmeplugBalance();
        if (!r.success) return { ok: false, message: r.configError || r.message || "Request failed." };
        return { ok: true, message: `Connected; wallet ₦${r.balance}.` };
    },
    async ogdams() {
        const r = await getOgdamsBalances();
        if (!r.success) return { ok: false, message: r.configError || r.message || `Request failed${r.httpStatus ? ` (HTTP ${r.httpStatus})` : ""}. Check the API key and that this server's IP is whitelisted in Ogdams.` };
        return { ok: true, message: "Connected." };
    },
    async flutterwave() {
        const key = process.env.FLW_SECRET_KEY;
        if (!key) return { ok: false, message: "Secret key is not set." };
        try {
            await axios.get("https://api.flutterwave.com/v3/balances", { headers: { Authorization: `Bearer ${key}` }, timeout: 15000 });
            return { ok: true, message: "Connected." };
        } catch (err) { return { ok: false, message: httpError(err) }; }
    },
    async paystack() {
        const key = process.env.PAYSTACK_SECRET_KEY;
        if (!key) return { ok: false, message: "Secret key is not set." };
        try {
            await axios.get("https://api.paystack.co/balance", { headers: { Authorization: `Bearer ${key}` }, timeout: 15000 });
            return { ok: true, message: "Connected." };
        } catch (err) { return { ok: false, message: httpError(err) }; }
    },
    async monnify() {
        await getMonnifyToken();
        return { ok: true, message: "Connected; authentication succeeded." };
    },
    async email() {
        await verifyEmailTransport();
        return { ok: true, message: `SMTP login to ${process.env.EMAIL_HOST || "smtp-relay.brevo.com"} succeeded.` };
    },
    async customDomains() {
        if (!process.env.VPS_PUBLIC_IPV4) return { ok: false, message: "VPS public IPv4 is not set." };
        const r = await runDomainHelper("check");
        return { ok: !!r.ok, message: r.message };
    }
};

let overrides = {};
/** Test hook: replace individual provider tests. */
export const __setConnectionTests = (o) => { overrides = o || {}; };

export const hasConnectionTest = (providerId) => Boolean(TESTS[providerId]);

export async function runConnectionTest(providerId) {
    const fn = overrides[providerId] || TESTS[providerId];
    if (!fn) return { ok: false, message: "No connection test is available for this integration." };
    try {
        const result = await Promise.race([
            fn(),
            new Promise((resolve) => setTimeout(() => resolve({ ok: false, message: "Timed out after 30 seconds." }), 30000).unref?.())
        ]);
        return { ok: !!result.ok, message: String(result.message || (result.ok ? "Connected." : "Failed.")) };
    } catch (err) {
        return { ok: false, message: err.response ? httpError(err) : (err.message || "Failed.") };
    }
}
