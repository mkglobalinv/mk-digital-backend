// Business WhatsApp number used to hand manual-service requests off to the
// processing team. Mirrors the number already hardcoded in CacModal.jsx /
// BvnModifyModal.jsx / NinModifyModal.jsx — not a new/invented number.
// Override at build time with VITE_BUSINESS_WHATSAPP_NUMBER if it ever changes.
export const BUSINESS_WHATSAPP_NUMBER =
  import.meta.env.VITE_BUSINESS_WHATSAPP_NUMBER || '2347081385387';
