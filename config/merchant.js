// Merchant program ("Reseller 2") constants -- a single source of truth
// shared by services/walletService.js's creditBalance (where activation is
// triggered) and controllers/merchantController.js (where it's reported to
// the frontend), so the two can never drift apart.
export const MERCHANT_MIN_ACTIVATION_AMOUNT = 2000;
