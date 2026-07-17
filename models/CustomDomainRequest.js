import mongoose from "mongoose";

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
  correctionRequired: { type: Boolean, default: false }
}, { 
  timestamps: true 
});

// Operational lookup indexes for speedy resolution
customDomainRequestSchema.index({ resellerId: 1 });
customDomainRequestSchema.index({ status: 1 });

export default mongoose.model("CustomDomainRequest", customDomainRequestSchema);
