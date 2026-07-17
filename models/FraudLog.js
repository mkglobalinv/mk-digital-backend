import mongoose from "mongoose";

const fraudLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  eventType: {
    type: String,
    required: true,
    enum: ["FAILED_PAYMENT", "FAILED_OTP", "SUSPICIOUS_IP", "RATE_LIMIT_EXCEEDED"]
  },
  ipAddress: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("FraudLog", fraudLogSchema);
