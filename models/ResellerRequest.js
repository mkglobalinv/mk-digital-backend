import mongoose from "mongoose";

const resellerRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  brandName: { type: String, required: true },
  businessName: { type: String },
  whatsapp: { type: String },
  supportEmail: { type: String },
  logo: { type: String },
  primaryColor: { type: String, default: "#3b82f6" },
  secondaryColor: { type: String, default: "#10b981" },
  domainOption: { 
    type: String, 
    enum: ["subdomain", "own_domain", "request_purchase"], 
    required: true 
  },
  requestedDomain: { type: String }, // subdomain prefix or full domain
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "processing_domain"], 
    default: "pending" 
  },
  adminNotes: { type: String },
  paymentReference: { type: String },
  domainCost: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false }
}, { 
  timestamps: true 
});

export default mongoose.model("ResellerRequest", resellerRequestSchema);
