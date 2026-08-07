# Identro Integration Guide & Deployment Checklist
**Status:** Provider module built and tested in isolation. Ready for future integration.

## Supported Endpoints
The `identro.js` module maps the following officially documented endpoints:
- **Identity Services:** NIN Verify, BVN Verify, CAC Name Search, CAC Basic, CAC Advanced, TIN Verify, Credit History, Address Lookup (Meter), Driver License, Voters Card.
- **Digital Services (VTU):** Product List, Airtime, Data Bundles, Electricity, Cable TV, Airtime ePINs, Data ePINs, Educational/ISP services, Requery.

## Unsupported Endpoints
The following services are explicitly **not documented** in the Identro Merchant API and have been stubbed as `TODO` returns `success: false`:
- NIN Modification
- BVN Modification
- CAC Registration
- Adult/Child Enrollment
- NIN Delink

## Configuration Requirements
To activate the Identro provider, ensure the following steps are taken:

1. **Environment Variables:**
   Add these to your production `.env` file (currently NOT added to prevent interference):
   ```
   IDENTRO_API_KEY=your_live_merchant_key
   IDENTRO_BASE_URL=https://api.identro.ng/merchant-api
   IDENTRO_WEBHOOK_SECRET=your_webhook_secret (if needed)
   ```

2. **Authentication Method:**
   Identro uses the `x-api-key` header for server-to-server authentication. The `identro.js` client automatically reads the key from the environment and attaches it.

3. **IP Whitelist:**
   You MUST whitelist the production server's static IP address in the Identro Dashboard before the API key will function in live mode.

4. **Webhooks:**
   Configure your webhook receiver URL in the Identro Dashboard. The provided `verifyWebhookSignature` function in `identro.js` can be used to validate the `sha256` HMAC signature sent by Identro.

## Activation Steps (When Ready)
Follow these steps ONLY when you are explicitly ready to integrate Identro into the live system:

1. Add the environment variables to `.env`.
2. Import `identro.js` into `services/switcher.js`.
3. Add `'identro'` to the allowed providers array/map in the Switcher.
4. Update the Pricing Engine V3 rules to include `identro` as a provider network.
5. Enable Identro in the Admin Provider Monitoring Dashboard (if applicable).
6. Verify live transactions using the sandbox or low-value production tests.

## Rollback Procedure
If the integration fails or causes regressions:
1. Revert the provider choice in `switcher.js` back to the previous default (e.g., `billsplash` or `peyflex`).
2. The `identro.js` file can be left alone, as it will simply become dormant again when un-routed.
3. No database rollbacks should be necessary as the module normalizes responses cleanly to the 9JASUB format.
