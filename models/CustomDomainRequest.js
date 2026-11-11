import mongoose from "mongoose";

// Lifecycle of a reseller custom domain served from our own VPS
// (services/domains/vpsDomainService.js drives the transitions).
export const VPS_DOMAIN_STATES = Object.freeze([
  "pending_dns",          // waiting for the reseller's A/TXT records
  "verifying",            // DNS correct, preparing nginx + reachability probe
  "pending_ssl",          // reachable, waiting for / retrying Let's Encrypt
  "active",               // HTTPS live and routed to the reseller storefront
  "ssl_renewal_required", // certificate close to expiry and not renewed
  "failed",               // needs an admin retry
  "suspended"             // turned off by an admin; certificate kept
]);

const customDomainRequestSchema = new mongoose.Schema({
  resellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  domainOption: { 
    type: String, 
    enum: ["subdomain", "custom_domain"], 
    required: true 
  },
  domainName: { type: String, required: true },
  registrarProvider: { type: String }, // e.g., Hostinger, Namecheap, GoDaddy, Cloudflare, Other
  whatsappNumber: { type: String },
  contactEmail: { type: String },
  status: { 
    type: String, 
    enum: [
      "Request Submitted", 
      "Pending Review", 
      "Domain Verification", 
      "SSL Activation", 
      "Website Deployment", 
      "Final Testing",
      "Connected Successfully", 
      "Failed / Needs Correction"
    ], 
    default: "Request Submitted" 
  },
  lifecycleStatus: { type: String }, // Granular status tracking
  sslStatus: { type: String, default: "Pending" },
  deploymentStatus: { type: String, default: "Pending" },
  adminNotes: { type: String },
  deploymentUrl: { type: String },
  liveUrl: { type: String },
  estimatedCompletionTime: { type: String },
  correctionRequired: { type: Boolean, default: false },
  
  // Infrastructure Extensions
  provider: { type: String, default: 'railway' },
  metaData: { type: mongoose.Schema.Types.Mixed, default: {} }, // For storing DNS records or provider-specific IDs

  // --- Self-hosted (Hostinger VPS) domain lifecycle. Only set when provider === 'vps'. ---
  domainState: { type: String, enum: [...VPS_DOMAIN_STATES, null], default: null },
  stateSince: { type: Date },
  includeWww: { type: Boolean, default: true },
  verificationToken: { type: String },
  dns: {
    lastCheckedAt: Date,
    apexOk: Boolean,
    wwwOk: Boolean,
    txtOk: Boolean,
    ipv6Ok: Boolean,
    apexRecords: [String],
    wwwRecords: [String],
    message: String
  },
  ssl: {
    issuedAt: Date,
    expiresAt: Date,
    issuer: String,
    lastCheckedAt: Date,
    lastAttemptAt: Date,
    attempts: { type: Number, default: 0 },
    nextAttemptAt: Date,
    lastError: String,
    renewAlertSentAt: Date
  },
  lastError: { type: String },
  disconnectRequest: {
    requestedAt: Date,
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected', null], default: null },
    resolvedAt: Date
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  activatedAt: { type: Date },
  lockedUntil: { type: Date },
  history: [{
    at: { type: Date, default: Date.now },
    state: String,
    message: String,
    _id: false
  }]
}, { 
  timestamps: true 
});

// Operational lookup indexes for speedy resolution
customDomainRequestSchema.index({ resellerId: 1 });
customDomainRequestSchema.index({ status: 1 });
customDomainRequestSchema.index({ deploymentStatus: 1 }); // Useful for the monitoring worker
// A VPS domain belongs to exactly one reseller, and a reseller has at most one VPS domain.
customDomainRequestSchema.index({ domainName: 1 }, { unique: true, partialFilterExpression: { provider: 'vps' }, name: 'vps_domain_unique' });
customDomainRequestSchema.index({ resellerId: 1 }, { unique: true, partialFilterExpression: { provider: 'vps' }, name: 'vps_reseller_unique' });
customDomainRequestSchema.index({ provider: 1, domainState: 1 });

export default mongoose.model("CustomDomainRequest", customDomainRequestSchema);
