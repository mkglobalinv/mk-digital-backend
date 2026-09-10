# Ogdams SimHosting Integration

Status: implemented, disabled by default (`OGDAMS_ENABLED=false`). Not deployed to production as of this writing -- see "Verification" below.

## What this is

`services/providers/ogdams.js` is a provider adapter for [Ogdams SimHosting](https://simhosting.ogdams.ng), implemented against their published API documentation (a Postman-hosted doc the vendor's own site links to). It follows the exact same plain-function pattern already used by every other provider in `services/providers/` (`peyflexV2.js`, `clubkonnect.js`) -- there is no new abstraction layer, no new base class, and `services/switcher.js` (the existing provider router) is the only thing that decides whether a given data plan is fulfilled through Ogdams.

**Nothing is routed to Ogdams automatically.** A data purchase only reaches Ogdams if an admin explicitly creates a `DataPlan` document with `provider: 'ogdams'` (see "Plan mapping" below) *and* `OGDAMS_ENABLED=true` is set. Both conditions are required; either one being false means the existing system behaves exactly as it did before this integration (Test A in Verification).

## Environment variables

```
OGDAMS_API_BASE_URL=https://simhosting.ogdams.ng/api/v1
OGDAMS_API_KEY=                # Bearer token, from Ogdams Dashboard -> API Key
OGDAMS_WEBHOOK_SECRET=         # optional -- see "Webhook signature key" below
OGDAMS_ENABLED=false
```

`validateOgdamsConfig()` runs once at server startup (`server.js`) and logs a clear warning if `OGDAMS_ENABLED=true` but `OGDAMS_API_KEY` is missing, rather than letting that surface as a confusing per-transaction failure later.

## Authentication

`Authorization: Bearer <OGDAMS_API_KEY>` on every request, per the documented convention. Credentials are read from `process.env` at module load, exactly like `PEYFLEX_API_TOKEN`/`CLUBKONNECT_API_KEY` already are -- this codebase's VTU providers do not use the AES-256-GCM encrypted-credential pattern (`models/GatewayConfig.js`); that pattern is scoped to payment gateways (Flutterwave/Xixapay) only, confirmed by inspecting every `services/providers/*.js` file.

## Endpoints used

| Purpose | Endpoint | Adapter function |
|---|---|---|
| Wallet/stock balance | `GET /get/balances` | `getOgdamsBalances()` |
| Data plan catalog | `GET /get/data/plans` | `getOgdamsDataPlans()` |
| Vend data | `POST /vend/data` | `buyDataWithOgdams(network, planId, phone, reference)` |
| Vend airtime | `POST /vend/airtime` | `buyAirtimeWithOgdams(network, amount, phone, reference, type)` |

The native `/vend/*` and `/get/*` endpoints were chosen over the documented SmePlug-compatible (`/data/purchase`, `/airtime/purchase`) and Msorg-compatible (`/data`, `/topup`) drop-in endpoints, since the native ones return a richer, more consistent envelope (`{status, code, data:{msg, ref}}`) and this is a first-party integration, not a migration from one of those other platforms.

`/sns/airtime` and `/custom/ussd/code` are documented by name only (no parameters/example were supplied) and are **not implemented** -- see "SIM-source investigation" below for why these two specifically matter.

## Network ID mapping

| Ogdams ID | Internal network string |
|---|---|
| 1 | `MTN` |
| 2 | `AIRTEL` |
| 3 | `GLO` |
| 4 | `9MOBILE` (Ogdams docs: "T2Mobile, formerly 9mobile"; the API may still return "9mobile") |

## Plan mapping

No new model was created. `models/DataPlan.js` already stores one document per `(network, provider, api_plan_id)` tuple with `api_price` (provider cost) and `selling_price` (customer price) -- this is exactly the internal-plan-to-provider-plan mapping layer requested. An Ogdams MTN plan is a `DataPlan` document with `provider: 'ogdams'` and `api_plan_id` set to Ogdams' own `planId` (e.g. `"101"`).

**No pricing was auto-populated.** Deciding `selling_price`/`reseller_price` is a business decision this integration does not make on your behalf. To onboard a plan: call `getOgdamsDataPlans()` (or `GET /get/data/plans` directly) to see Ogdams' `planId`/`price`/`validity`, then create the corresponding `DataPlan` document through the existing admin flow, with a matching `PricingRule` for that `(network, category)` -- `calculateVtuPrice` throws without one.

## Transaction lifecycle & idempotency

Unchanged from the existing architecture -- this integration plugs into it, it does not replace it:

1. `POST /api/publicApi/data` creates a `Transaction(status:'processing')` and calls `deductBalance` *before* the provider call (`routes/publicApiRoutes.js`).
2. `smartBuyData` (`services/switcher.js`) resolves the plan's provider from `DataPlan.provider`; when it's `'ogdams'`, calls `buyDataWithOgdams(...)`.
3. The internal transaction id generated inside `smartBuyData` (`TXN-<timestamp>`) is passed to Ogdams as its `reference` field (max 40 chars per docs) -- this is what "your existing transaction ID as the idempotency key" means in practice for this call.
4. Response handling:
   - `code:200, status:true` -> `success` -> transaction finalized, reseller profit applied.
   - `code:201` (queued) or `code:202` (processing) -> `unknown` -> **never treated as success**. Matches Ogdams' own documented behavior ("Transaction recorded. Expect response in 5 secs" is not a final outcome).
   - `code:424` or a definite auth/config error -> `failed` -> `refundBalance` runs (existing wallet logic, unmodified).
   - A timeout or network error during `/vend/data`/`/vend/airtime` -> `unknown`, and **is never automatically retried**. See "Why no retry" below.
5. `unknown` transactions are resolved by the Ogdams webhook (primary path) or left for admin review -- there is no status-check requery for Ogdams (see next section).

### Why no retry after a timeout

Ogdams documents no transaction-status/requery-by-reference endpoint. The response-code table lists `404 -- Transaction not found`, implying *some* endpoint returns that, but no such endpoint appears among the documented list. Without one, a timed-out `/vend/data` call cannot be distinguished from one that succeeded server-side -- retrying could double-vend. `services/providers/ogdams.js`'s `ogdamsVend()` wrapper therefore **never retries a vend call**, full stop, regardless of the error type. (Read-only calls like `getOgdamsBalances`/`getOgdamsDataPlans` do retry on timeout/5xx -- they're side-effect-free.)

This is not a new pattern invented for Ogdams -- it's the same posture already established in this codebase for PeyFlex, which also has no working verify endpoint (`services/providers/peyflex.js`'s `requeryPeyflex()` stub, and PeyFlex's own `'unknown'` status handling in `peyflexV2.js`). `requeryOgdams()` mirrors that stub exactly: it always returns `{status:'pending'}` rather than guessing.

**Practical consequence: the Ogdams webhook is not optional.** Without it configured and working, any Ogdams transaction that comes back ambiguous (201/202, or a timeout) will sit as `unknown` indefinitely except for admin manual review -- there is no automated way to resolve it.

## Webhook

`POST /api/webhook/ogdams` (`routes/webhookRoutes.js`).

**Signature verification**: HMAC-SHA512 of the raw request body, per the documented `ogdams-simhosting-signature` header. Verified with `crypto.timingSafeEqual` (constant-time comparison). An invalid or missing signature is rejected with HTTP 401 before any transaction lookup happens.

**Webhook signature key**: the docs say the HMAC is "signed with your secret key" -- the same phrase used earlier in the docs for the Bearer auth token (`sk_live_...`). The implementation defaults to `OGDAMS_API_KEY` as the HMAC key, with `OGDAMS_WEBHOOK_SECRET` available as an override in case Ogdams' dashboard exposes a distinct webhook-specific secret that wasn't shown in the supplied documentation excerpt. **This default is inferred from the literal doc text, not confirmed against a real webhook delivery** -- verify it against Ogdams' first real webhook call (see Test H below) and adjust if it turns out to use a different key.

**Payload shape**: no example webhook body was supplied in the documentation. `normalizeOgdamsWebhookStatus()` assumes the webhook reuses the same envelope already documented for `/vend/data`/`/vend/airtime` responses (`{status:true|false, code:<int>, data:{msg, ref}}`) -- this is the most reasonable inference available (Ogdams' one other documented response shape), **not a confirmed fact**. If a real webhook delivery uses different field names, this is the only function that needs to change.

**Idempotency**: webhook processing calls the existing `resolveTransactionByReference()` (`services/requeryService.js`), which only acts on a transaction still in `pending`/`unknown` status -- a duplicate or replayed webhook for an already-resolved transaction is a safe no-op by construction, unchanged from how the existing ClubKonnect/PeyFlex webhooks already behave.

**Raw body capture**: `server.js`'s global `express.json()` now has a `verify` callback that stores the exact request bytes on `req.rawBody`, additively -- every other route's `req.body` parsing is unaffected. This was necessary because HMAC verification must run against the exact bytes Ogdams signed; re-serializing the already-parsed `req.body` back to JSON could differ in key order/whitespace and silently break every signature check.

## Error handling

Provider responses are mapped to internal categories (`PROVIDER_AUTH_ERROR`, `PROVIDER_TIMEOUT`, `PROVIDER_UNAVAILABLE`, `TRANSACTION_FAILED`, `TRANSACTION_PENDING`, `UNKNOWN_PROVIDER_ERROR`) and a clean, generic customer-facing message. **`INSUFFICIENT_PROVIDER_BALANCE`, `INVALID_RECIPIENT`, and `INVALID_PLAN` are not distinguished from the generic `TRANSACTION_FAILED`** -- the supplied documentation's 424 response example doesn't give sub-codes or example message text finer-grained than "provider returned an error," so guessing a mapping would be fabrication. The raw failure body is logged server-side (never returned to the customer) specifically so real 424 message text can be observed from live traffic and this mapping refined with evidence once it's available.

## Failover

Ogdams participates in the existing `ProviderStatus`-based monitoring (`ensureOgdamsProviderStatus()` upserts a `providerName:'ogdams'` document at startup, `priority:3`, so it shows up in the admin provider list and `GET /api/admin/providers`), but **is not wired into any cross-provider failover chain**. This mirrors the existing, deliberate design already documented in `switcher.js`: data purchases do not fail over between providers at all, because plan codes are provider-specific and a failover with the same plan code would always return an invalid-plan error, never a working purchase. Ogdams becoming reachable for a given plan is entirely a matter of which provider that `DataPlan` document names -- there is no "try Ogdams if the primary fails" behavior for data, matching how PeyFlex and ClubKonnect already behave for data today.

## How to enable

1. Set `OGDAMS_API_KEY` and `OGDAMS_ENABLED=true`.
2. Set the webhook URL in the Ogdams dashboard to `https://<your-domain>/api/webhook/ogdams`.
3. Create `DataPlan` documents (`provider: 'ogdams'`) for whichever plans you want fulfilled through Ogdams, with matching `PricingRule` rows.
4. Confirm `GET /api/admin/providers` shows an `ogdams` entry, and `GET /api/admin/providers/ogdams/status` reports `configured: true`.

## How to test

`tests/ogdamsProvider.test.js` covers the adapter and webhook-signature logic against nock-mocked HTTP -- no real network call, no real money. Run with:

```
NODE_OPTIONS=--experimental-vm-modules npx jest tests/ogdamsProvider.test.js --forceExit
```

(`--forceExit` is needed because `routes/webhookRoutes.js` transitively imports `services/emailService.js`, which performs an unconditional SMTP `transporter.verify()` at module load time -- a pre-existing behavior unrelated to this integration, not something introduced here.)

For a real, controlled test against Ogdams' live API (no sandbox is documented), start with the read-only calls (`getOgdamsBalances`, `getOgdamsDataPlans`) before ever calling `buyDataWithOgdams`/`buyAirtimeWithOgdams`, since a real vend call spends real money with no safe way to cancel it.

## SIM-source vs wallet-source -- CONFIRMED

Ogdams support confirmed directly: **MTN Data Gifting (`/vend/data` against one of the plan IDs below) is fulfilled from the merchant's own connected MTN SIM's airtime/MoMo balance. The Ogdams wallet (`mainBalance`) is only charged a small automation fee per transaction, not the cost of the data itself.**

This confirms `/vend/data` is, and was always, the correct endpoint -- no separate "gifting" endpoint exists, and the API request itself (`networkId`, `planId`, `phoneNumber`, `reference`) never needs a source/sender identifier, since the connected-SIM association is configured entirely on Ogdams' own dashboard (SIM & Cloud / Sim Connection / GIFTING / APP screens), outside anything this integration's API calls send. No code needed to change for the vend call itself as a result of this confirmation.

`sourceType` is still not populated as a distinct tracked field on the transaction (no SIM/device ID is returned in the API response to store), but the *method* is now known and enforced structurally: only the three whitelisted plan IDs below can ever be synced as Ogdams MTN plans, so any successful Ogdams data transaction in this system is, by construction, an MTN Data Gifting transaction.

## MTN Data Gifting plan IDs (confirmed by Ogdams support)

`/get/data/plans` documents no category/type field, so Gifting plans cannot be distinguished from any other MTN plan Ogdams might return by inspecting the response alone. `services/providers/ogdams.js`'s `MTN_DATA_GIFTING_PLAN_IDS` is a hard whitelist -- `getOgdamsMtnGiftingPlans()` (used by the admin sync, not the general-purpose `getOgdamsDataPlans()`) only ever returns plans matching these IDs, discarding anything else even if Ogdams' API returns other MTN plans mixed into the same response:

| Plan ID | Description |
|---|---|
| 541 | 500MB Daily |
| 497 | 1GB Daily |
| 498 | 2.5GB Daily |

Real price/name/validity for these still come from the live `/get/data/plans` response at sync time -- only the plan ID whitelist is hardcoded, never a price or name.
