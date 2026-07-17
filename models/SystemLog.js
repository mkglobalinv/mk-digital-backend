import mongoose from "mongoose";

const systemLogSchema = new mongoose.Schema({
  severity: {
    type: String,
    enum: ["INFO", "WARNING", "ERROR", "CRITICAL"],
    default: "INFO",
    index: true
  },
  service: {
    type: String,
    required: true,
    index: true
  },
  module: {
    type: String,
    index: true
  },
  endpoint: {
    type: String
  },
  action: {
    type: String
  },
  message: {
    type: String,
    required: true
  },
  stack_trace: {
    type: String
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
  reseller_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
  provider: {
    type: String,
    index: true
  },
  status: {
    type: String
  },
  recommended_action: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Setup automatic TTL index if we want to prune old logs after e.g. 30 days
// 30 days = 30 * 24 * 60 * 60 = 2,592,000 seconds
systemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("SystemLog", systemLogSchema);
