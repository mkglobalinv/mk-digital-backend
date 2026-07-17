import mongoose from "mongoose";

const backupLogSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  size: { type: String },
  fileCount: { type: Number, default: 0 },
  dbRecordsCount: { type: Number, default: 0 },
  checksum: { type: String },
  storageLocation: { type: String },
  type: { type: String, enum: ['full', 'db', 'uploads'], default: 'full' },
  status: { type: String, enum: ['success', 'failed', 'processing', 'partial', 'valid', 'invalid', 'verified'], default: 'processing' },
  durationMs: { type: Number },
  error: { type: String },
  triggeredBy: { type: String, default: 'system' }
}, { timestamps: true });

backupLogSchema.index({ createdAt: 1, status: 1 });

export default mongoose.model("BackupLog", backupLogSchema);
