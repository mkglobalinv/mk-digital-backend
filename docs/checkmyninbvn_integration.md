# CheckMyNINBVN Integration Guide

## Current State
- The CheckMyNINBVN provider is currently **DORMANT** and **ISOLATED**.
- It is implemented in `services/providers/checkmyninbvn.js`.
- It has **NOT** been imported into `switcher.js`.
- It is **NOT** active in production.
- Zero production files were modified to create this integration module.

## How to Activate
Once testing (`tests/checkmyninbvn_live.test.js`) is successful and the provider is verified as reliable, take the following steps to activate it in production:

1. **Update `services/switcher.js`**:
   - Import the CheckMyNINBVN functions.
   - Expand `smartBuyIdentity` to route traffic to CheckMyNINBVN based on database configurations.
   
2. **Update Database (Optional depending on architecture)**:
   - Ensure the provider is registered in the `ProviderStatus` collection.
   - Toggle `isAvailable: true` when ready.

3. **Update Provider Monitoring**:
   - Ensure CheckMyNINBVN is included in provider health check cycles (using the `/balance` endpoint).
