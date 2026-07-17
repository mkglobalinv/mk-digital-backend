import mongoose from "mongoose";

const appRequestSchema = new mongoose.Schema({
  resellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  appName: { type: String, required: true },
  logo: { type: String }, // Base64 or URL
  primaryColor: { type: String, default: "#3b82f6" },
  accentColor: { type: String, default: "#f59e0b" },
  splashScreen: { type: String }, // Base64 or URL
  supportEmail: { type: String },
  resellerPhone: { type: String }, // Attached phone tracker for instant WhatsApp routing
  notes: { type: String },
  status: { 
    type: String, 
    enum: [
      "Pending Review", 
      "Preparing Assets", 
      "Generating Assets",
      "Building Application",
      "Testing Application",
      "Ready for Delivery",
      "Delivered",
      "Revision Required",
      "Failed Build",
      // Legacy equivalents preserved for DB state safety
      "Packaging App", 
      "Testing Build", 
      "Ready", 
      "Failed",
      // Automatic Build Pipeline status states
      "Generating...",
      "Sending to Builder...",
      "Build in Progress...",
      "APK Ready",
      "Build Failed"
    ], 
    default: "Pending Review" 
  },
  estimatedDeliveryTime: { type: String, default: "72 hours" },
  apkUrl: { type: String },
  apkUploadedAt: { type: Date },
  apkFileSize: { type: String },
  
  // Hybrid Managed Studio Fields
  resellerAppUrl: { type: String },
  aabUrl: { type: String },
  aabUploadedAt: { type: Date },
  aabFileSize: { type: String },
  manifestConfig: { type: Object },
  packageMetadata: { type: Object },
  packageIdentifiers: {
    packageName: { type: String },
    bundleId: { type: String }
  },

  playStoreAssets: { 
    iconUrl: { type: String },
    featureGraphicUrl: { type: String },
    screenshots: [{ type: String }]
  },
  appVersion: { type: String, default: "1.0.0" },
  deliveryDate: { type: Date },
  adminNotes: { type: String }
}, { 
  timestamps: true 
});

// Operational lookup indexes for rapid polling resolution in the Build Studio
appRequestSchema.index({ resellerId: 1 });
appRequestSchema.index({ status: 1 });

export default mongoose.model("AppRequest", appRequestSchema);
