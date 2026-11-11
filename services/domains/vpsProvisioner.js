import { execFile } from "child_process";
import { normalizeDomain } from "./domainValidation.js";

// Runs deploy/vps/9jasub-domainctl, the only code that writes nginx config or
// runs certbot. Called via one sudoers rule (see deploy/vps/DOMAINS_SETUP.md),
// with an argument list and no shell, so a domain value can never become a
// command. The helper re-validates the domain itself as well.

const ACTIONS = new Set(["prepare", "issue", "renew", "remove", "cert-info", "check"]);

export const getHelperConfig = () => ({
    command: process.env.DOMAIN_HELPER_PATH || "/usr/local/sbin/9jasub-domainctl",
    useSudo: process.env.DOMAIN_HELPER_USE_SUDO !== "false",
    timeoutMs: parseInt(process.env.DOMAIN_HELPER_TIMEOUT_MS, 10) || 180000
});

export async function runDomainHelper(action, domain = null, { includeWww = false } = {}) {
    if (!ACTIONS.has(action)) throw new Error(`Unknown domain helper action: ${action}`);
    const args = [action];
    if (action !== "check") {
        // Only an already-normalized domain may be passed through.
        if (normalizeDomain(domain) !== domain) throw new Error("Domain must be normalized before provisioning.");
        args.push(domain);
        if (includeWww) args.push("--www");
    }
    const { command, useSudo, timeoutMs } = getHelperConfig();
    const file = useSudo ? "sudo" : command;
    const argv = useSudo ? ["-n", command, ...args] : args;

    return new Promise((resolve) => {
        execFile(file, argv, { env: process.env, timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
            const line = String(stdout || "").trim().split("\n").filter(Boolean).pop() || "";
            let parsed = null;
            try { parsed = JSON.parse(line); } catch { /* fall through */ }
            if (parsed && typeof parsed.ok === "boolean") return resolve(parsed);
            const reason = err?.killed ? `timed out after ${timeoutMs / 1000}s` : (String(stderr || "").trim().split("\n").pop() || err?.message || "no output");
            resolve({ ok: false, action, domain, message: `Domain helper failed: ${reason}` });
        });
    });
}

/** Parses the helper's openssl notAfter ("Feb  3 12:00:00 2027 GMT"). */
export function parseCertDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}
