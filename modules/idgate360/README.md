# IDGate360 Module (Isolated / Not Integrated)

This is a **standalone**, self-contained module for the IDGate360 API
(NIN/BVN verification slips, bank account verification, IPE clearance, NIN
validation). It is not imported by, and does not import from, the existing
VTU production system (`server.js`, `routes/`, `controllers/`, `services/`,
`models/`). It runs as its own Express app on its own port so it can be
tested end-to-end before any integration decision is made.

## Files

- `client.js` — axios client for `https://idgate360.com.ng/api`, injects `api_key` into every request body, masks sensitive fields (nin/bvn/phone/dob/api_key) in logs.
- `validators.js` — Joi request validation per endpoint (fails fast with 400 before spending an upstream call).
- `controller.js` — request handlers, one per upstream endpoint. Passes upstream JSON straight through; slip endpoints support `?download=true` to stream a decoded PDF instead.
- `routes.js` — Express router wiring validators + controllers.
- `server.js` — standalone Express server entry point (own port, own process).
- `smoke-test.mjs` — quick script that exercises every route against the running standalone server.

## Setup

Add to your local `.env` (already gitignored):

```
IDGATE360_API_KEY=idg_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
IDGATE360_BASE_URL=https://idgate360.com.ng/api
IDGATE360_PORT=4360
```

## Run standalone

```bash
npm run idgate360:dev     # nodemon, auto-restart
# or
npm run idgate360:start   # plain node
```

Then:

```bash
curl http://localhost:4360/health
```

## Endpoints (mounted under `/api/idgate360`)

| Method | Path | Upstream |
|---|---|---|
| POST | `/api/idgate360/nin/premium` | `/nin/premium` |
| POST | `/api/idgate360/nin/phone-premium` | `/nin/phone-premium` |
| POST | `/api/idgate360/nin/demo` | `/nin/demo` |
| POST | `/api/idgate360/bvn/premium` | `/bvn/premium` |
| POST | `/api/idgate360/bank/verify` | `/bank/verify` |
| POST | `/api/idgate360/ipe/submit` | `/ipe/submit` |
| POST | `/api/idgate360/ipe/status` | `/ipe/status` |
| POST | `/api/idgate360/nin/validate` | `/nin/validate` |
| POST | `/api/idgate360/nin/validate-status` | `/nin/validate-status` |

You do **not** need to send `api_key` in the request body — the client
injects it from `IDGATE360_API_KEY` automatically. Send only the
endpoint-specific fields documented by IDGate360.

### Example: NIN slip by NIN number

```bash
curl -X POST http://localhost:4360/api/idgate360/nin/premium \
  -H "Content-Type: application/json" \
  -d '{"nin":"12345678901"}'
```

Add `?download=true` to get the PDF file directly instead of base64 JSON:

```bash
curl -X POST "http://localhost:4360/api/idgate360/nin/premium?download=true" \
  -H "Content-Type: application/json" \
  -d '{"nin":"12345678901"}' \
  -o nin_slip.pdf
```

### Example: Bank account verification

```bash
curl -X POST http://localhost:4360/api/idgate360/bank/verify \
  -H "Content-Type: application/json" \
  -d '{"bvn":"22333444555","bankCode":"000013","bankAccount":"0123456789"}'
```

### Example: IPE clearance submit + poll

```bash
curl -X POST http://localhost:4360/api/idgate360/ipe/submit \
  -H "Content-Type: application/json" \
  -d '{"trackingID":"ABC12345XYZ"}'

curl -X POST http://localhost:4360/api/idgate360/ipe/status \
  -H "Content-Type: application/json" \
  -d '{"trackingID":"ABC12345XYZ"}'
```

### Example: NIN validation submit + poll

```bash
curl -X POST http://localhost:4360/api/idgate360/nin/validate \
  -H "Content-Type: application/json" \
  -d '{"nin":"12345678901"}'

curl -X POST http://localhost:4360/api/idgate360/nin/validate-status \
  -H "Content-Type: application/json" \
  -d '{"nin":"12345678901"}'
```

## Smoke test

With the standalone server running in one terminal:

```bash
node modules/idgate360/smoke-test.mjs
```

This hits `/health` and every route with sample payloads and prints
status codes + response bodies, so you can confirm auth/wiring/upstream
connectivity without touching production.

## Integration (later, not done yet)

Nothing here is wired into `server.js`. When you're ready to integrate:

1. Review results from standalone testing.
2. Decide the mount path in the main app (e.g. `app.use('/api/idgate360', idgate360Routes)` in `server.js`), whether it needs `middlewares/auth.js` / rate limiting / wallet-debit logic like the existing `bvnRoutes.js`, and whether pricing/wallet integration is required for the paid endpoints (IPE clearance, NIN validation).
3. Move `IDGATE360_API_KEY` / `IDGATE360_BASE_URL` from local `.env` into your real deployment environment variables.

None of these steps have been taken — this module is intentionally inert
with respect to the production app until you confirm it's ready.
