// Every configuration value managed from System Settings -> Integrations &
// API Configuration. Only variables the application actually reads are
// listed; the key is the environment variable name, so the existing .env
// value keeps working as the fallback.
//
// type: secret (masked, never returned) | identifier (account id, masked) |
//       url | host | port | email | name | ipv4 | ipv6 | bool | hostlist |
//       bucket | ga | pixel
// default: for bool settings, how the code treats an unset value.
// applies: "live" (takes effect immediately) | "rebuild" (needs a rebuild of
//          the marketing site; the value is stored now)

const s = (key, label, type, extra = {}) => ({ key, label, type, ...extra });

export const SETTINGS = [
    // Supabase
    s("SUPABASE_URL", "Supabase URL", "url", { placeholder: "https://xxxx.supabase.co" }),
    s("SUPABASE_SERVICE_KEY", "Service Role Key", "secret"),
    s("SUPABASE_BUCKET", "Storage Bucket", "bucket", { placeholder: "Reseller-app" }),

    // VTU providers
    s("PEYFLEX_API_TOKEN", "API Token", "secret"),
    s("PEYFLEX_API_URL", "API URL", "url", { placeholder: "https://client.peyflex.com.ng" }),
    s("CLUBKONNECT_USERID", "User ID", "identifier"),
    s("CLUBKONNECT_API_KEY", "API Key", "secret"),
    s("CALLBACK_URL", "Callback URL", "url", { optional: true }),
    s("SMEPLUG_API_KEY", "API Key", "secret"),
    s("SMEPLUG_API_BASE_URL", "API Base URL", "url", { optional: true, placeholder: "https://smeplug.ng/api/v1" }),
    s("SMEPLUG_ENABLED", "Enabled", "bool", { default: "false" }),
    s("OGDAMS_API_KEY", "API Key", "secret"),
    s("OGDAMS_API_BASE_URL", "API Base URL", "url", { optional: true, placeholder: "https://simhosting.ogdams.ng/api/v1" }),
    s("OGDAMS_WEBHOOK_SECRET", "Webhook Secret", "secret", { optional: true, help: "Defaults to the API key if empty." }),
    s("OGDAMS_ENABLED", "Enabled", "bool", { default: "false" }),
    s("BILLSPLASH_API_KEY", "API Key", "secret"),
    s("BILLSPLASH_BASE_URL", "API Base URL", "url", { optional: true, placeholder: "https://billsplash.com/api" }),

    // Payment gateways
    s("FLW_SECRET_KEY", "Secret Key", "secret"),
    s("FLW_WEBHOOK_HASH", "Webhook Hash", "secret"),
    s("PAYMENTPOINT_API_KEY", "API Key", "secret"),
    s("PAYMENTPOINT_SECRET_KEY", "Secret Key", "secret"),
    s("PAYMENTPOINT_BUSINESS_ID", "Business ID", "identifier"),
    s("PAYMENTPOINT_WEBHOOK_SECRET", "Webhook Secret", "secret"),
    s("WITTYPAY_BASE_URL", "Base URL", "url", { optional: true, placeholder: "https://wittypay.co/api/merchant/v1" }),
    s("WITTYPAY_SECRET_KEY", "Secret Key", "secret"),
    s("WITTYPAY_WEBHOOK_SECRET", "Webhook Secret", "secret", { optional: true, help: "Defaults to the secret key if empty." }),
    s("PAYSTACK_SECRET_KEY", "Secret Key", "secret"),
    s("MONNIFY_BASE_URL", "Base URL", "url", { placeholder: "https://api.monnify.com" }),
    s("MONNIFY_API_KEY", "API Key", "secret"),
    s("MONNIFY_SECRET_KEY", "Secret Key", "secret"),
    s("MONNIFY_CONTRACT_CODE", "Contract Code", "identifier"),

    // Analytics (read by the Next.js marketing site at build time)
    s("NEXT_PUBLIC_GA_MEASUREMENT_ID", "Google Analytics Measurement ID", "ga", { applies: "rebuild", placeholder: "G-XXXXXXXXXX" }),
    s("NEXT_PUBLIC_META_PIXEL_ID", "Meta Pixel ID", "pixel", { applies: "rebuild", placeholder: "123456789012345" }),

    // Email (SMTP via nodemailer; Brevo SMTP is the default host)
    s("EMAIL_HOST", "SMTP Host", "host", { placeholder: "smtp-relay.brevo.com" }),
    s("EMAIL_PORT", "SMTP Port", "port", { placeholder: "587" }),
    s("EMAIL_USER", "SMTP Username", "identifier"),
    s("EMAIL_PASS", "SMTP Password / Key", "secret"),
    s("EMAIL_FROM", "Sender Email", "email", { placeholder: "no-reply@9jasub.com" }),
    s("EMAIL_SENDER_NAME", "Sender Name", "name", { optional: true, placeholder: "9JASUB", help: "Used for platform emails; reseller emails use the reseller's brand name." }),

    // Custom domains
    s("VPS_PUBLIC_IPV4", "VPS Public IPv4", "ipv4"),
    s("VPS_PUBLIC_IPV6", "VPS Public IPv6", "ipv6", { optional: true }),
    s("DOMAIN_HELPER_USE_SUDO", "Run domain helper with sudo", "bool", { optional: true, default: "true", help: "Turn off only if the app runs as root." }),
    s("LEGACY_HOST_SUBDOMAIN_FALLBACK", "Legacy Host Subdomain Fallback", "hostlist", { optional: true, help: "Comma-separated. Empty it after linking with the domains migration." }),
    s("DOMAIN_REQUIRE_TXT_VERIFICATION", "Require TXT ownership record", "bool", { optional: true, default: "true" }),
    s("DOMAIN_RESERVED", "Reserved domains", "hostlist", { optional: true, help: "Other sites on this VPS that resellers must never claim." }),
    s("VPS_DOMAINS_ENABLED", "Automatic domain processing", "bool", { default: "true" }),

    // Platform
    s("ADMIN_EMAIL", "Admin alert email", "email"),
    s("FRONTEND_URL", "Frontend URL", "url", { help: "Used for payment redirects." })
];

// toggle: how "enabled" is controlled, using the mechanism the code already
//   honours -- { setting: KEY } (a bool setting) or { providerStatus: name }
//   (the existing ProviderStatus manual switch). null = no switch exists in code.
// test: whether a connection test is implemented (services/settings/connectionTests.js).
export const PROVIDERS = [
    { id: "supabase", group: "supabase", name: "Supabase", description: "Storage and analytics sync", settings: ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "SUPABASE_BUCKET"], test: true, toggle: null },

    { id: "peyflex", group: "vtu", name: "Peyflex", description: "Data, airtime, bills and education PINs", settings: ["PEYFLEX_API_TOKEN", "PEYFLEX_API_URL"], test: true, toggle: { providerStatus: "peyflex" } },
    { id: "clubkonnect", group: "vtu", name: "ClubKonnect", description: "Data, airtime, bills and e-PINs", settings: ["CLUBKONNECT_USERID", "CLUBKONNECT_API_KEY", "CALLBACK_URL"], test: true, toggle: { providerStatus: "clubkonnect" } },
    { id: "smeplug", group: "vtu", name: "SMEPlug", description: "MTN Gifting data", settings: ["SMEPLUG_API_KEY", "SMEPLUG_API_BASE_URL"], test: true, toggle: { setting: "SMEPLUG_ENABLED" } },
    { id: "ogdams", group: "vtu", name: "Ogdams SIM Hosting", description: "MTN Gifting data. Whitelist this server's IP in Ogdams.", settings: ["OGDAMS_API_KEY", "OGDAMS_API_BASE_URL", "OGDAMS_WEBHOOK_SECRET"], test: true, toggle: { setting: "OGDAMS_ENABLED" } },
    { id: "billsplash", group: "vtu", name: "Billsplash", description: "NIN / BVN verification", settings: ["BILLSPLASH_API_KEY", "BILLSPLASH_BASE_URL"], test: false, toggle: null },

    { id: "flutterwave", group: "payments", name: "Flutterwave", description: "Card / bank funding and webhooks", settings: ["FLW_SECRET_KEY", "FLW_WEBHOOK_HASH"], test: true, toggle: null },
    { id: "paymentpoint", group: "payments", name: "PaymentPoint", description: "Virtual accounts and webhooks", settings: ["PAYMENTPOINT_API_KEY", "PAYMENTPOINT_SECRET_KEY", "PAYMENTPOINT_BUSINESS_ID", "PAYMENTPOINT_WEBHOOK_SECRET"], test: false, toggle: null },
    { id: "wittypay", group: "payments", name: "WittyPay", description: "Virtual accounts and webhooks", settings: ["WITTYPAY_BASE_URL", "WITTYPAY_SECRET_KEY", "WITTYPAY_WEBHOOK_SECRET"], test: false, toggle: null },
    { id: "paystack", group: "payments", name: "Paystack", description: "Wallet funding", settings: ["PAYSTACK_SECRET_KEY"], test: true, toggle: null },
    { id: "monnify", group: "payments", name: "Monnify", description: "Wallet funding and webhooks", settings: ["MONNIFY_BASE_URL", "MONNIFY_API_KEY", "MONNIFY_SECRET_KEY", "MONNIFY_CONTRACT_CODE"], test: true, toggle: null },

    { id: "analytics", group: "analytics", name: "Marketing site analytics", description: "Google Analytics and Meta Pixel on the marketing website", settings: ["NEXT_PUBLIC_GA_MEASUREMENT_ID", "NEXT_PUBLIC_META_PIXEL_ID"], test: false, toggle: null },

    { id: "email", group: "email", name: "Email (SMTP)", description: "OTP, receipts and alerts", settings: ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS", "EMAIL_FROM", "EMAIL_SENDER_NAME"], test: true, toggle: null },

    { id: "customDomains", group: "domains", name: "Custom Domains", description: "Reseller domains on the VPS", settings: ["VPS_PUBLIC_IPV4", "VPS_PUBLIC_IPV6", "DOMAIN_HELPER_USE_SUDO", "LEGACY_HOST_SUBDOMAIN_FALLBACK", "DOMAIN_REQUIRE_TXT_VERIFICATION", "DOMAIN_RESERVED"], test: true, toggle: { setting: "VPS_DOMAINS_ENABLED" } },

    { id: "platform", group: "platform", name: "Platform", description: "Alerts and redirects", settings: ["ADMIN_EMAIL", "FRONTEND_URL"], test: false, toggle: null }
];

export const GROUPS = [
    { id: "supabase", name: "Supabase" },
    { id: "vtu", name: "VTU Providers" },
    { id: "payments", name: "Payment Gateways" },
    { id: "analytics", name: "Analytics" },
    { id: "email", name: "Email" },
    { id: "domains", name: "Custom Domains" },
    { id: "platform", name: "Platform" }
];

export const SETTINGS_BY_KEY = new Map(SETTINGS.map((d) => [d.key, d]));
export const PROVIDERS_BY_ID = new Map(PROVIDERS.map((p) => [p.id, p]));
// Credentials that are masked in every response.
export const isMaskedType = (type) => type === "secret" || type === "identifier";
