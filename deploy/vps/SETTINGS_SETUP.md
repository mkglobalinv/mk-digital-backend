# Integrations & API Configuration (System Settings)

Admin → **System & Maintenance → Integrations & API Config**
(`/admin/system-settings/integrations`) lets the Super Admin manage provider
credentials without editing `.env`:

* Each integration shows **Connected / Failed / Not Configured** (and "Configured · not tested").
* Some integrations have a **Test Connection** button. It makes one read-only call per test: a balance or profile lookup, an auth handshake or an SMTP login. Nothing is bought or sent.
* SMEPlug, Ogdams and Custom Domains have an **on/off switch** stored as a setting. Peyflex and ClubKonnect use the existing provider on/off switch.
* Secret inputs have show/hide controls. After saving, only a mask (`••••••••abcd`) is ever shown.
* There's a **Save** button per integration, **Save All**, and a **Change history** that records who changed what and when (values are never recorded).

## How values are stored and applied

* **Encryption:** AES-256-GCM, bound to the setting name, in the `integrationcredentials` collection. The master key is the server-only env var `SETTINGS_ENCRYPTION_KEY`; it is never stored in MongoDB or sent to the browser.
* **Precedence:** a value saved in the dashboard overrides `.env`. **Use .env value** removes the dashboard value, and the `.env` value applies again immediately. With nothing saved, `.env` works exactly as before.
* **Live changes:** saving takes effect immediately, with **no restart**, for Supabase, Peyflex, ClubKonnect, SMEPlug, Ogdams, Billsplash, Flutterwave, PaymentPoint, WittyPay, Paystack, Monnify, Email (SMTP), Custom Domains and the platform settings.
* **Needs a rebuild:** the Google Analytics and Meta Pixel IDs are compiled into the marketing website. Save them, then rebuild that site (step 4).
* **Stays in `.env` on purpose:** `MONGO_URI`, `JWT_SECRET`, `PORT`, `SETTINGS_ENCRYPTION_KEY`. The app needs them before it can read the dashboard settings.
* **Access:** only accounts with role `superadmin`, plus the owner account, can open the page or call `/api/admin/integrations`. Admins, resellers, merchants and customers get 403.

## Hostinger VPS deployment

### 1. New environment variable (required to save credentials)
Generate the key **once** on the VPS and add it to the app's `.env`. Don't change any other variable.
```bash
openssl rand -hex 32          # 64 hex characters
nano /var/www/mk-digital-backend/.env
# add:  SETTINGS_ENCRYPTION_KEY=<the 64 hex characters>
```
**Back this key up** somewhere safe, outside the server, such as a password manager.
If it's lost or changed, saved credentials can't be decrypted. The app then falls back to `.env`, and the dashboard asks you to re-enter them.
Without the key the page still opens and shows `.env` values, but saving is refused.

### 2. Deploy and restart
```bash
cd /var/www/mk-digital-backend
npm ci
pm2 restart mk-digital-backend --update-env
pm2 logs mk-digital-backend --lines 50 | grep "\[Settings\]"
# [Settings] Loaded 0 dashboard setting(s); 0 unreadable.
```

### 3. Database migration
None to run. The three new collections (`integrationcredentials`, `integrationauditlogs`, `integrationproviderstates`) are created on first use. No existing data or variables are modified.

### 4. Analytics IDs: rebuild the marketing site after changing them
```bash
cd /var/www/mk-digital-backend
node scripts/settings/run-with-settings.js -- npm run build --prefix mk-subdata-website
pm2 restart mk-digital-backend
```
`run-with-settings.js` applies the dashboard values to that one command's environment and prints nothing secret.

### 5. Moving credentials from `.env` into the dashboard (optional)
Open the page. Every integration shows "From server .env" for the values it uses today.
Re-enter a value there only if you want to manage it from the dashboard. Then click **Test Connection**.
Keep the `.env` lines until everything shows **Connected**; they remain the fallback.

## Rollback
* **Keep the code, stop using dashboard values:** clear them with **Use .env value**, or remove `SETTINGS_ENCRYPTION_KEY` and restart. `.env` values then apply.
* **Previous release:** redeploy it and restart. The new collections are simply ignored, and `.env` works exactly as before.
* **Remove the stored data** (optional; credentials are encrypted at rest anyway):
  `mongosh "$MONGO_URI" --eval 'db.integrationcredentials.drop(); db.integrationproviderstates.drop()'`
  Keep `integrationauditlogs` if you want the change history.

## Not included (not supported by the current code)
* **Resend:** the app sends email over SMTP (nodemailer, Brevo by default). There's no Resend integration, so Email shows the SMTP host/port/user/password, sender email and sender name.
* **Jarapoint API key / base URL:** only a static plan list is used; no Jarapoint API is called.
* **Flutterwave public key and encryption key, `CLUBKONNECT_BASE_URL`, `BREVO_API_KEY`, `CHECKMYNINBVN_API_KEY`:** present on Railway, but no code reads them.
* **Identro, IDGate360, Reloadly:** their modules aren't wired into the running app, or don't use env credentials.
* **On/off switches for payment gateways:** the payment code has no enable switch. Removing a key makes that gateway fail rather than switch off cleanly, so no switch is shown.
* **Existing "Gateway Settings"** (`/api/admin/gateways`, `GatewayConfig`): a separate older store that the live Flutterwave code doesn't read. Left unchanged.

## Tests
```bash
npm i --no-save mongodb-memory-server@10      # test-only dependency
NODE_OPTIONS=--experimental-vm-modules npx jest tests/settings --forceExit
```
`--forceExit` is needed because the admin router's imports start background timers.
