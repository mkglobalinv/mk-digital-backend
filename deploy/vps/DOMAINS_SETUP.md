# Reseller custom domains on the Hostinger VPS

Admins connect a reseller's own domain (e.g. `mybusiness.com`) to that
reseller's storefront from **Admin → Domains**. The reseller points DNS
straight at the VPS (no Cloudflare, no nameserver change); 9jaSub verifies
DNS and ownership, issues a Let's Encrypt certificate, writes an isolated
nginx site and switches the domain on.

```
reseller's registrar           Hostinger VPS
  A    @     -> VPS IP   ─┐    nginx :80/:443
  A    www   -> VPS IP   ─┼──▶   /etc/nginx/9jasub-domains/<domain>.conf  (generated)
  TXT  _9jasub-verify    ─┘      └─ proxy_pass 127.0.0.1:8800 (PM2 app)
                                       └─ middlewares/whiteLabel.js → reseller by Host
```

| Piece | File | Runs as |
|---|---|---|
| Lifecycle (DNS → SSL → active, retries, expiry alerts) | `services/domains/vpsDomainService.js`, driven every minute by `services/domainMonitor.js` | app user |
| DNS + ownership check (public resolvers) | `services/domains/dnsVerifier.js` | app user |
| nginx + certbot changes | `deploy/vps/9jasub-domainctl` → `/usr/local/sbin/9jasub-domainctl` | **root**, via one sudoers rule |
| Admin UI / API | `mk-vtu-frontend/src/admin/pages/AdminDomains.jsx`, `routes/adminDomainRoutes.js` (`/api/admin/domains`, owner only) | |
| Reseller UI / API | `mk-vtu-frontend/src/reseller/components/CustomDomainPanel.jsx`, `GET /api/reseller/custom-domain` | |

The helper only ever writes `/etc/nginx/9jasub-domains/<domain>.conf`. Every
change is checked with `nginx -t` before a graceful `systemctl reload nginx`,
and the previous file is restored if the check fails. It refuses any hostname
another nginx site on the VPS already serves, so other applications on the
server cannot be taken over or broken.

---

## 1. One-time VPS setup

Run as root on the VPS. Nothing here changes the running sites until step 1.6.

### 1.1 Packages and firewall
```bash
apt-get update && apt-get install -y certbot openssl util-linux   # util-linux provides flock
ufw allow 80/tcp && ufw allow 443/tcp    # if ufw is active; also open both ports in Hostinger's firewall
systemctl list-timers | grep -i certbot  # certbot's renewal timer must be listed
```

### 1.2 Install the helper
```bash
cd /var/www/mk-digital-backend           # wherever the release is unpacked
install -o root -g root -m 755 deploy/vps/9jasub-domainctl /usr/local/sbin/9jasub-domainctl
mkdir -p /etc/9jasub /etc/nginx/9jasub-domains /var/www/9jasub-acme/.well-known/acme-challenge
chmod 755 /var/www/9jasub-acme /var/www/9jasub-acme/.well-known /var/www/9jasub-acme/.well-known/acme-challenge
install -o root -g root -m 600 deploy/vps/domainctl.conf.example /etc/9jasub/domainctl.conf
nano /etc/9jasub/domainctl.conf          # set CERTBOT_EMAIL; LISTEN_IPV6=0 if the VPS has no IPv6
```

### 1.3 Allow the app user to run it
Find the user PM2 runs the app as: `ps -o user= -p $(pm2 pid mk-digital-backend)`.
```bash
sed "s/^deploy /APPUSER /" deploy/vps/sudoers-9jasub-domainctl > /tmp/9jasub-sudoers   # replace APPUSER
visudo -cf /tmp/9jasub-sudoers && install -m 440 /tmp/9jasub-sudoers /etc/sudoers.d/9jasub-domainctl
```
If the app runs as **root**, skip this and set `DOMAIN_HELPER_USE_SUDO=false` (step 1.5).
`sudo` resets the environment, so the app cannot point the helper at a different config file.

### 1.4 Main platform site: overwrite `X-Forwarded-Host`
In the existing 9jasub.com nginx site, add this next to `proxy_set_header Host $host;`
(as in `nginx.conf.example`):
```nginx
proxy_set_header X-Forwarded-Host $host;
```
The app chooses the reseller from this header. Without the line, a visitor
can send their own `X-Forwarded-Host` and be shown another reseller's storefront.
The generated reseller sites already set it.

### 1.5 App environment (`.env` next to `server.js`)
Add only the variables below, and keep everything else as it is. Required: `VPS_PUBLIC_IPV4`.
```bash
VPS_PUBLIC_IPV4=<the VPS public IPv4, as shown in hPanel>
# VPS_PUBLIC_IPV6=<only if resellers may add AAAA records pointing here>
# DOMAIN_HELPER_USE_SUDO=false   # only if PM2 runs the app as root
```
Full list in [section 4](#4-environment-variables).

### 1.6 Include the managed directory in nginx (the only edit to existing nginx config)
In `/etc/nginx/nginx.conf`, inside `http { ... }`, after the existing `include` lines:
```nginx
include /etc/nginx/9jasub-domains/*.conf;
```
The directory is empty, so this changes nothing yet. Verify and reload:
```bash
nginx -t && systemctl reload nginx
sudo -u APPUSER sudo -n /usr/local/sbin/9jasub-domainctl check
# {"ok":true,"action":"check","domain":"","message":"Domain provisioning is ready."}
```

### 1.7 Deploy the release, then migrate the database
```bash
npm ci && pm2 restart mk-digital-backend --update-env
node scripts/migrations/2026-11-vps-custom-domains.js             # dry run: shows current routing
node scripts/migrations/2026-11-vps-custom-domains.js --apply      # creates the indexes
# link custom domains that only worked through the old first-label match
node scripts/migrations/2026-11-vps-custom-domains.js --apply --link-host midataplus.com=midataplus
# optional: put existing (Railway-era) custom domains under management
node scripts/migrations/2026-11-vps-custom-domains.js --apply --import-legacy
```
**Why `--link-host`:** in production, `midataplus.com` has no `customDomain`
stored. Until now it resolved only because its first label equals the
reseller's subdomain (`midataplus`), which is the spoofable lookup this release
removes. To keep it working through the deploy, `LEGACY_HOST_SUBDOMAIN_FALLBACK`
defaults to `midataplus.com`, which keeps the old lookup for that exact host
only. After `--link-host`, set `LEGACY_HOST_SUBDOMAIN_FALLBACK=` (empty) and restart.
The dry run lists every account's routing so you can spot others.
`mksubdata.com` already has `customDomain` set and needs nothing.
Imported domains keep routing exactly as before. They show as **Pending DNS**
until the reseller's DNS points at the VPS and the TXT record exists. Then they get a certificate.

### 1.8 First end-to-end test (Let's Encrypt staging)
1. In `/etc/9jasub/domainctl.conf` set `ACME_STAGING=1`.
2. Use a domain you control. Admin → Domains → **Custom Domain** → pick a test reseller → enter the domain → **Add Domain**.
3. Create the three DNS records shown. Within a few minutes the domain should move **Pending DNS → Verifying → Pending SSL → Active**.
   With staging, the last step stays **Pending SSL** with "https … not reachable (UNABLE_TO_VERIFY_LEAF_SIGNATURE)". That is expected: staging certificates are untrusted.
4. `curl -k https://<domain>/` should return the reseller storefront, and `curl -I http://<domain>/` should return a `301` to https.
5. Remove the test domain in the admin, set `ACME_STAGING=0`, and add it again.
   It should now reach **Active**, and the browser should show a valid padlock.

Admin → Domains → **System check** runs `9jasub-domainctl check` at any time.

---

## 2. Connecting a domain (admin)

1. **Custom Domain** → select the reseller → enter `mybusiness.com` (www is added automatically for an apex domain) → **Add Domain**.
2. Send the reseller the records shown. The reseller also sees them on their Domain page:

   | Type | Name | Value |
   |---|---|---|
   | A | `@` | VPS IPv4 |
   | A | `www` | VPS IPv4 |
   | TXT | `_9jasub-verify` | `9jasub-verify=<token>` |

   Other A or AAAA records for `@`/`www` must be removed (the check rejects mixed records).
3. Everything else is automatic. Use **Check now** to skip the wait.

**Generate Domain** gives a reseller a free `<name>.9jasub.com` address instead.
It's covered by the platform's existing wildcard certificate and needs no DNS.

### Statuses
| Status | Meaning | What happens next |
|---|---|---|
| Pending DNS | Records missing or not propagated; the exact problem is shown | Re-checked every 2 min; **Failed** after 72 h |
| Verifying | DNS and TXT are correct; nginx site prepared; checking the domain reaches this server | Automatic |
| Pending SSL | Requesting the Let's Encrypt certificate | Retries with backoff: 15 min, 30 min, 1 h … (max 12 h); **Failed** after 5 attempts |
| Active | HTTPS live, storefront routed | Certificate checked every 6 h |
| SSL Renewal Required | Certificate expires in < 20 days and certbot has not renewed it | Admin alert e-mail once a day; site stays up |
| Failed | Needs an admin. Reason shown | **Retry verification** / **Retry SSL** |
| Suspended | Turned off by an admin; visitors see "Website not found"; certificate kept | **Resume** |

The domain is routed to the reseller (`User.customDomain`) **only** when it becomes Active.
Suspend and Remove clear the routing first.

---

## 3. SSL: issuance, renewal, rate limits

* **Issuance:** `certbot certonly --webroot` (HTTP-01) with `--keep-until-expiring`, so a retry never requests a duplicate certificate. Each domain has its own certificate (`/etc/letsencrypt/live/<domain>/`).
* **Renewal:** certbot's own systemd timer renews certificates within 30 days of expiry. Each certificate is stored with `--deploy-hook "systemctl reload nginx"`.
* **Monitoring:** the app reads the certificate actually served, every 6 h. If it expires in less than 20 days (`SSL_RENEW_ALERT_DAYS`), renewal has failed: the domain shows **SSL Renewal Required**, and `ADMIN_EMAIL` gets an alert at most once a day. **Renew SSL** runs `certbot renew --cert-name <domain>`.
* **HTTPS enforcement:** port 80 redirects to https (except the ACME challenge path), and HSTS is sent (`max-age=31536000`, without `includeSubDomains`, because resellers may run other subdomains).
* **Let's Encrypt rate limits:**
  * A certificate is only requested after DNS is correct on two public resolvers *and* the domain is proven to reach this server's nginx. This avoids failed validations, which LE limits to 5 per hour.
  * At most `ACME_MAX_ISSUANCES_PER_HOUR` requests per hour across all domains.
  * Per-domain exponential backoff.
  * A "too many certificates / rate limit" response waits 24 h without using up an attempt.
  * Use `ACME_STAGING=1` for testing.

---

## 4. Environment variables

App `.env`. All optional except `VPS_PUBLIC_IPV4`. Defaults shown.

| Variable | Default | Purpose |
|---|---|---|
| `VPS_PUBLIC_IPV4` | — (**required**) | IP the A records must point to |
| `VPS_PUBLIC_IPV6` | empty | Allow AAAA records pointing here; any other AAAA record fails verification |
| `PLATFORM_BASE_DOMAINS` | `9jasub.com,mk-subdata.com` | Hosts `<label>.<base>` resolve to platform subdomains; these can never be claimed as custom domains |
| `LEGACY_HOST_SUBDOMAIN_FALLBACK` | `midataplus.com` | Hosts still resolved by first label (transitional). Empty it after `--link-host` |
| `DOMAIN_RESERVED` | empty | Extra domains (comma-separated) that can never be claimed, e.g. other apps on this VPS |
| `DNS_RESOLVERS` | `1.1.1.1,8.8.8.8` | Public resolvers that must all agree |
| `DOMAIN_REQUIRE_TXT_VERIFICATION` | `true` | Require the `_9jasub-verify` TXT ownership record |
| `DOMAIN_HELPER_PATH` | `/usr/local/sbin/9jasub-domainctl` | Helper location |
| `DOMAIN_HELPER_USE_SUDO` | `true` | `false` when the app runs as root |
| `DOMAIN_HELPER_TIMEOUT_MS` | `180000` | Max time for one helper call |
| `VPS_DOMAINS_ENABLED` | `true` | `false` pauses all automatic domain processing |
| `DOMAIN_DNS_TIMEOUT_HOURS` | `72` | Pending DNS → Failed after this long |
| `DOMAIN_DNS_CHECK_INTERVAL_SEC` | `120` | Min time between automatic DNS checks per domain |
| `SSL_MAX_ATTEMPTS` | `5` | Failed issuance attempts before Failed |
| `SSL_RETRY_BASE_MINUTES` | `15` | First retry delay (doubles each time, capped at 12 h) |
| `ACME_MAX_ISSUANCES_PER_HOUR` | `10` | Global certificate requests per hour |
| `SSL_RENEW_ALERT_DAYS` | `20` | Alert when the served certificate expires sooner than this |
| `DOMAIN_ACTIVE_CHECK_HOURS` | `6` | How often active domains are re-checked |
| `DOMAIN_ALLOW_DISCONNECT_REQUESTS` | `true` | Resellers can request disconnection |
| `ADMIN_EMAIL` | existing | Receives SSL and setup alerts |
| `RAILWAY_POLL_INTERVAL` | `60000` | Existing domain monitor interval (ms); also drives VPS domain processing |

Helper settings live in `/etc/9jasub/domainctl.conf` (root only). See `domainctl.conf.example`.

---

## 5. Security model

* **One domain, one reseller:** enforced by unique database indexes (`vps_domain_unique`, `vps_reseller_unique`) and re-checked against `User.customDomain` (which is also unique) before activation.
* **Ownership:** the reseller must publish a random per-domain TXT token, and A records must point only at the VPS. A domain cannot be activated by someone who doesn't control its DNS.
* **Unsafe hostnames rejected:** IPs, wildcards, single labels, internal/test TLDs, hosting-provider domains, platform domains and their subdomains, `DOMAIN_RESERVED`, and any character outside `[a-z0-9.-]` (IDNs are converted to punycode). The root helper re-validates independently.
* **Tenant routing (`middlewares/whiteLabel.js`):** `<label>.9jasub.com` resolves by subdomain; any other host must exactly equal a reseller's `customDomain`.
  *Fixed in this release:* previously the first label of **any** hostname was tried as a subdomain, so `acme.attacker.com` would show reseller `acme`'s storefront.
  *Also fixed:* a reseller's domain request no longer sets `customDomain` before verification.
  Only hosts listed in `LEGACY_HOST_SUBDOMAIN_FALLBACK` keep the old first-label lookup, until they're linked.
* **Header spoofing:** generated sites always overwrite `Host` and `X-Forwarded-Host`; apply step 1.4 to the main site.
* **Other apps on the VPS:** the helper refuses hostnames already in any other nginx config, never edits files outside `/etc/nginx/9jasub-domains/`, and rolls back on a failed `nginx -t`. HTTP/2 is left off by default because enabling it changes port 443 for every site.
* **Privileges:** the Node app never runs nginx or certbot itself. It calls one root-owned helper through one sudoers rule, using an argument list (no shell).

---

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| "VPS_PUBLIC_IPV4 is not set" banner | Add it to `.env`, `pm2 restart mk-digital-backend --update-env` |
| Pending DNS with "found: x.x.x.x" | The A record points elsewhere (often the registrar's parking IP); replace it |
| "Remove the AAAA record(s)" | Delete AAAA records for `@`/`www` at the registrar, or set `VPS_PUBLIC_IPV6` if they point here |
| "does not reach this server yet" | DNS caches still old, or port 80 blocked in Hostinger's firewall |
| Failed: "already served by another site on this server" | Another nginx config on the VPS has that `server_name`; remove it there first |
| Failed: "Domain helper failed: sudo: a password is required" | Sudoers rule missing or wrong user (step 1.3) |
| Pending SSL with LE "Invalid response … 404" | Something answers `/.well-known/acme-challenge/` before our site. Check `nginx -T` for a conflicting `default_server` or redirect |
| System check: "nginx does not include …" | Step 1.6 |

Logs: `pm2 logs mk-digital-backend | grep -E "Domains|DomainMonitor"`.
Helper by hand:
```bash
sudo /usr/local/sbin/9jasub-domainctl cert-info mybusiness.com
```
Generated configs: `/etc/nginx/9jasub-domains/`. Backups of the previous versions: `/etc/nginx/9jasub-domains/.backup/`.

---

## 7. Rollback

The feature is additive, so each layer can be undone separately.

1. **Stop automatic processing** (no nginx or certbot changes from then on): set `VPS_DOMAINS_ENABLED=false`, then `pm2 restart mk-digital-backend --update-env`.
2. **Previous app version:** redeploy the previous release, then `npm ci && pm2 restart mk-digital-backend`.
   Domains that are already Active keep working: their nginx sites and certificates stay, and the old routing code also resolves `User.customDomain`.
3. **Database:** `node scripts/migrations/2026-11-vps-custom-domains.js --rollback`.
   This drops the two new indexes and deletes records created by `--import-legacy`. Admin-created domain records are kept, as are all users.
4. **Take the reseller sites off nginx** (only if you want them gone):
   ```bash
   mkdir -p /root/9jasub-domains-disabled && mv /etc/nginx/9jasub-domains/*.conf /root/9jasub-domains-disabled/
   nginx -t && systemctl reload nginx
   ```
   Then remove the `include /etc/nginx/9jasub-domains/*.conf;` line, and run `nginx -t && systemctl reload nginx` again.
   Certificates stay in `/etc/letsencrypt` until `certbot delete --cert-name <domain>`.
5. **Remove the helper:** `rm /usr/local/sbin/9jasub-domainctl /etc/sudoers.d/9jasub-domainctl /etc/9jasub/domainctl.conf`.

Steps 4–5 never touch other sites' nginx configs or certificates.

---

## 8. Running the tests

```bash
npm i --no-save mongodb-memory-server@10      # test-only; not added to package.json
NODE_OPTIONS=--experimental-vm-modules npx jest tests/domains
```

| Suite | What it covers |
|---|---|
| `domainValidation.test.js` | Unsafe and reserved hostnames, punycode, platform-subdomain parsing |
| `dnsVerifier.test.js` | A/www/AAAA/TXT checks, propagation disagreement, missing config |
| `vpsDomainService.test.js` | Full lifecycle on a real MongoDB: multiple resellers, ownership conflicts, tenant routing, DNS timeout, SSL backoff and rate limits, expiry alerts, suspend/resume/remove, disconnect requests, concurrent workers |
| `nginxProvisioning.test.js` | The real helper against a real nginx that already hosts another site on 80/443: conflict refusal, HTTP probe, HTTPS + redirect, header overwrite, two reseller domains side by side, failed validation, `nginx -t` rollback, concurrent runs, remove. Needs root, nginx, curl, openssl and free ports 80/443; skipped otherwise. certbot is stubbed |
