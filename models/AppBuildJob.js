import mongoose from "mongoose";

const appBuildJobSchema = new mongoose.Schema({
  resellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  appName: { type: String, required: true },
  packageName: { type: String, required: true },
  status: {
    type: String,
    enum: ["queued", "processing", "completed", "failed"],
    default: "queued"
  },
  stage: {
    type: String,
    default: "Initializing Build Engine"
  },
  progressPct: {
    type: Number,
    default: 0
  },
  buildLogs: [{ type: String }],
  outputArtifacts: {
    apkUrl: String,
    iconUrl: String,
    splashUrl: String,
    featureGraphicUrl: String,
    screenshots: [String],
    manifestUrl: String
  },
  manifestPath: { type: String }, // Relative path to manifest.json
  buildType: { type: String, default: 'PWA' },
  versionCode: { type: Number, default: 1 },
  versionName: { type: String, default: '1.0.0' },
  checksum: { type: String }, // MD5/SHA checksum of the primary artifact
  performance: {
    generationDurationMs: { type: Number },
    memoryUsageMb: { type: Number },
    cpuUsagePct: { type: Number }
  },
  infrastructure: {
    storageStrategy: { type: String, default: 'local' },
    serverNode: { type: String } // For multi-server tracking
  },
  errorDetails: { type: String },
  completedAt: { type: Date },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  failedAt: { type: Date }
}, { timestamps: true });

// Performance Indexes for high-frequency queries
appBuildJobSchema.index({ status: 1, createdAt: -1 });
appBuildJobSchema.index({ resellerId: 1, status: 1 });
appBuildJobSchema.index({ createdAt: 1 }); // For cleanup tasks

export default mongoose.model("AppBuildJob", appBuildJobSchema);
