import mongoose from "mongoose";
import { getSupabaseClient } from '../services/supabaseClient.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  balance1: { type: Number, default: 0 },
  balance2: { type: Number, default: 0 },
  account_number: { type: String, default: "" },
  bank_name: { type: String, default: "" },
  account_reference: { type: String, default: "" },
  account_number2: { type: String, default: "" },
  bank_name2: { type: String, default: "" },
  account_reference2: { type: String, default: "" },
  accountType: { type: String, enum: ["none", "temporary", "permanent"], default: "none" },
  accountExpiryDate: { type: Date },
  temporaryAmount: { type: Number },
  role: { type: String, enum: ["user", "admin", "superadmin", "reseller_admin"], default: "user" },
  activationRewardGiven: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  isProcessingTx: { type: Boolean, default: false },
  transactionLimit: { type: Number, default: 10000 }, // Default limit per transaction for new users
  dailySpent: { type: Number, default: 0 },
  lastSpentReset: { type: Date, default: Date.now },
  forcePasswordChange: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  transactionPin: { type: String, default: "" }, // Hashed
  failedPinAttempts: { type: Number, default: 0 },
  pinLockoutUntil: { type: Date },
  bvn: { type: String, default: "" },
  isSignupComplete: { type: Boolean, default: false },
  securityQuestions: [{
    question: String,
    answer: String // Hashed, lowercase, trimmed
  }],
  kycData: {
    fullName: String,
    phone: String,
    address: String,
    idNumber: String
  },
  kycVerified: { type: Boolean, default: false },
  favoriteDataPlans: [{
    phone: String
  }],
  biometricEnabled: { type: Boolean, default: false },
  webauthnCredentials: [{
    credentialID: String,
    publicKey: String,
    counter: { type: Number, default: 0 }
  }],
  // API System
  apiKey: { type: String, unique: true, sparse: true },
  apiSecret: { type: String },
  apiLevel: { type: String, enum: ["normal", "reseller", "premium"], default: "normal" },
  ipWhitelist: [{ type: String }],
  webhookUrl: { type: String, default: "" },
  // Enterprise Upgrade
  testApiKey: { type: String, unique: true, sparse: true },
  testApiSecret: { type: String },
  sandboxBalance: { type: Number, default: 100000 },
  apiSubscriptionTier: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  earningsBalance: { type: Number, default: 0 },
  cashbackBalance: { type: Number, default: 0 },
  activationRewardGiven: { type: Boolean, default: false },
  referralCodeUsed: { type: String, default: null },
  // White Label & Branding
  subdomain: { type: String, unique: true, sparse: true },
  customDomain: { type: String, unique: true, sparse: true },
  whiteLabelStatus: { type: String, enum: ["pending", "active", "suspended", "rejected"], default: "pending" },
  branding: {
    siteName: { type: String },
    logo: { type: String },
    favicon: { type: String },
    primaryColor: { type: String, default: "#3b82f6" },
    secondaryColor: { type: String, default: "#10b981" },
    backgroundColor: { type: String, default: "#f8fafc" },
    balanceCardColor: { type: String, default: "#1e293b" },
    footerText: { type: String },
    contactEmail: { type: String },
    whatsappNumber: { type: String },
    supportAvailability: { type: String, default: "Mon-Fri 9AM-5PM" }, // New
    telegramLink: { type: String },
    socialLinks: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  // Phase 11: Website Owner Independence Engine
  admin_subdomain: { type: String, unique: true, sparse: true },
  independence_redirect_enabled: { type: Boolean, default: true },
  admin_logo_url: { type: String },
  theme_color_primary: { type: String, default: "#0f172a" },
  theme_color_secondary: { type: String, default: "#38bdf8" },
  
  // Phase 12: Emergency Data Purchase Engine
  emergencyId: { type: String, unique: true, sparse: true },

  maintenanceMode: { type: Boolean, default: false },
  serviceControl: {
    data: { type: Boolean, default: true },
    airtime: { type: Boolean, default: true },
    cable: { type: Boolean, default: true },
    electricity: { type: Boolean, default: true }
  },
  apiCallCount: { type: Number, default: 0 },
  lastApiCall: { type: Date },
  // Security & Admin Control
  withdrawalPin: { type: String, default: "" }, // Hashed
  isFrozen: { type: Boolean, default: false }, // Super Admin can freeze wallets
  twoFactorEnabled: { type: Boolean, default: false },
  lastLoginIp: { type: String },
  loginActivity: [{
    ip: String,
    device: String,
    status: { type: String, enum: ['success', 'failed', 'suspicious', 'step1_success', 'otp_verified', 'failed_security_answer'], default: 'success' },
    timestamp: { type: Date, default: Date.now }
  }],
  // Admin-Only Security Hardening
  adminFundingPassword: { type: String, default: "" }, // Hashed
  adminSecuritySetupComplete: { type: Boolean, default: false },
  adminSecurityQuestionsSet: { type: Boolean, default: false },
  failedLoginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date },
  knownDevices: [{
    deviceId: String,
    browser: String,
    os: String,
    lastUsed: { type: Date, default: Date.now }
  }],
  securityLogs: [{
    action: String,
    details: String,
    ip: String,
    timestamp: { type: Date, default: Date.now }
  }],
  // Onboarding System
  resellerActivationStatus: { 
    type: String, 
    enum: ["none", "pending_payment", "pending_onboarding", "pending_approval", "active", "suspended"], 
    default: "none" 
  },
  domainOption: { 
    type: String, 
    enum: ["subdomain", "own_domain", "request_purchase", null], 
    default: null 
  },
  onboardingData: {
    brandName: String,
    businessName: String,
    whatsapp: String,
    supportEmail: String,
    logo: String,
    primaryColor: String,
    secondaryColor: String,
    requestedDomain: String
  },
  // Onboarding banner status
  welcomeBannerSeen: { type: Boolean, default: false },
  businessGuideSeen: { type: Boolean, default: false },
  // New Reseller Business Model Fields
  trialStartDate: { type: Date },
  trialEndDate: { type: Date },
  isGracePeriod: { type: Boolean, default: false },
  gracePeriodEndDate: { type: Date },
  resellerTier: { type: String, enum: ["basic", "vip", "premium"], default: "basic" },
  isResellerActivated: { type: Boolean, default: false },
  premiumExpiresAt: { type: Date },
  premiumActivatedAt: { type: Date },
  customPricingEnabled: { type: Boolean, default: false },
  customBannerEnabled: { type: Boolean, default: false },
  canOverridePricing: { type: Boolean, default: false }, // Explicit permission — true for premium/vip, false for basic
  resellerType: { type: String, enum: ["basic", "premium"], default: "basic" },
  assignedPrices: { type: Map, of: Number, default: {} },
  customPrices: { type: Map, of: Number, default: {} },
  
  // Modular SaaS Feature Management
  features: {
    custom_domain: { type: Boolean, default: false },
    apk_generation: { type: Boolean, default: false },
    pwa_enabled: { type: Boolean, default: true },
    push_notifications: { type: Boolean, default: false },
    premium_analytics: { type: Boolean, default: false },
    ai_tools: { type: Boolean, default: false },
    playstore_publish: { type: Boolean, default: false },
    ios_app: { type: Boolean, default: false },
    premium_branding: { type: Boolean, default: false },
    dedicated_support: { type: Boolean, default: false }
  },
  enabledFuturePlatforms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FuturePlatform' }],

  // Future App Infrastructure (APK/iOS Metadata)
    appSettings: {
      appName: String,
      appLogo: String,
      splashScreen: String,
      packageName: String,
      appColors: {
        primary: String,
        secondary: String,
        accent: String
      },
      generatedAssets: {
        apkUrl: String,
        iconUrl: String,
        splashUrl: String,
        featureGraphicUrl: String,
        screenshots: [String],
        isReady: { type: Boolean, default: false },
        lastGeneratedAt: Date
      },
      playStoreMetadata: {
        shortDescription: String,
        fullDescription: String,
        supportEmail: String,
        privacyPolicyUrl: String,
        websiteUrl: String
      },
      oneSignalAppId: String,
      googleJson: String, // Stringified JSON for Firebase
      appleAuth: String
    },

  subscriptionExpiresAt: { type: Date },
  premiumSubscriptionType: { type: String, enum: ["none", "6months", "12months"], default: "none" },
  lastExpiryNoticeSent: { type: Date },

  // Phase 12: Account Archival (Duplicate Merge)
  archived: { type: Boolean, default: false },
  archivedReason: { type: String },
  mergedInto: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  archivedAt: { type: Date },

  // Tenant Isolation — the reseller this user belongs to (portal where they registered).
  // Completely independent of referredBy, which is referral/commission lineage only.
  tenantOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Manual Services independently activated by website owner
  activatedManualServices: [{ type: String, enum: ['nin_modification', 'bvn_modification', 'cac_registration'] }]
}, { 

  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to allow same email on different reseller portals
userSchema.index({ email: 1, tenantOwnerId: 1 }, { unique: true, partialFilterExpression: { archived: false } });
// Keep legacy referredBy index for referral/commission queries (not for auth)
userSchema.index({ referredBy: 1 });

// Standalone performance indexes for frequent read resolution
userSchema.index({ role: 1 });
userSchema.index({ tenantOwnerId: 1 });
userSchema.index({ resellerTier: 1, canOverridePricing: 1 }); // Pricing permission queries

userSchema.virtual('totalBalance').get(function() {
  return (this.balance1 || 0) + (this.balance2 || 0);
});

userSchema.virtual('profitBalance').get(function() {
  return this.earningsBalance || 0;
});

userSchema.post('save', async function(doc) {
  // We sync to Supabase if branding or subdomain changes, and the user is a reseller
  try {
    if (doc.role === 'reseller_admin') {
      const supabase = getSupabaseClient();
      if (supabase) {
        if (doc.subdomain) {
          await supabase.from('reseller_branding').upsert({
            user_id: doc._id.toString(),
            subdomain: doc.subdomain,
            site_name: doc.branding?.siteName || '',
            primary_color: doc.branding?.primaryColor || '#3b82f6',
            secondary_color: doc.branding?.secondaryColor || '#10b981',
            background_color: doc.branding?.backgroundColor || '#f8fafc',
            logo_url: doc.branding?.logo || '',
            whatsapp_number: doc.branding?.whatsappNumber || '',
            support_availability: doc.branding?.supportAvailability || 'Mon-Fri 9AM-5PM',
            reseller_tier: doc.resellerTier || 'basic',
            verified_contact: doc.kycData?.phone || doc.onboardingData?.whatsapp || '',
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        }
        
        if (doc.features) {
          await supabase.from('feature_flags').upsert({
            user_id: doc._id.toString(),
            custom_domain: doc.features.custom_domain || false,
            apk_generation: doc.features.apk_generation || false,
            pwa_enabled: doc.features.pwa_enabled !== false,
            push_notifications: doc.features.push_notifications || false,
            premium_analytics: doc.features.premium_analytics || false,
            ai_tools: doc.features.ai_tools || false,
            playstore_publish: doc.features.playstore_publish || false,
            ios_app: doc.features.ios_app || false,
            premium_branding: doc.features.premium_branding || false,
            dedicated_support: doc.features.dedicated_support || false,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        }
      }
    }
  } catch (err) {
    console.error('[Supabase Sync] Failed to sync branding:', err);
  }
});
/**
 * findByTenant — resolve a user by email within the correct portal context.
 * Tenant ownership is determined EXCLUSIVELY by tenantOwnerId.
 * referredBy is NEVER used here — it belongs to the referral/commission engine only.
 *
 * @param {string} email
 * @param {ObjectId|string|null} resellerId — null means Main Platform
 */
userSchema.statics.findByTenant = async function(email, resellerId) {
  const users = await this.find({ email: email.toLowerCase() });
  if (!users || users.length === 0) return null;

  if (resellerId) {
    // Reseller portal: return the user that belongs to this tenant OR is the owner themselves
    return users.find(u =>
      u._id.toString() === resellerId.toString() ||
      (u.tenantOwnerId && u.tenantOwnerId.toString() === resellerId.toString())
    ) || null;
  } else {
    // Main platform: return a user that has no tenant owner (registered on main platform)
    // Admins/superadmins are always accessible on main platform
    return users.find(u => u.role === 'admin' || u.role === 'superadmin') ||
           users.find(u => !u.tenantOwnerId) ||
           null;
  }
};

/**
 * findByIdAndTenant — resolve a user by _id within the correct portal context.
 * Same isolation rules as findByTenant.
 */
userSchema.statics.findByIdAndTenant = async function(id, resellerId) {
  const user = await this.findById(id);
  if (!user) return null;

  // Admins/superadmins are always accessible
  if (user.role === 'admin' || user.role === 'superadmin') return user;

  if (resellerId) {
    // Reseller portal: user must belong to this tenant or be the owner
    if (
      user._id.toString() === resellerId.toString() ||
      (user.tenantOwnerId && user.tenantOwnerId.toString() === resellerId.toString())
    ) {
      return user;
    }
    return null;
  } else {
    // Main platform: user must not belong to any tenant
    if (!user.tenantOwnerId) return user;
    return null;
  }
};

export default mongoose.model("User", userSchema);