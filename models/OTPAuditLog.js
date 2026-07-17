import mongoose from "mongoose";

const otpAuditLogSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ["request", "resend", "verify_success", "verify_failed"],
    required: true
  },
  deliveryStatus: {
    type: String,
    enum: ["sent", "failed", "n/a"],
    default: "n/a"
  },
  attempts: {
    type: Number,
    default: 0
  },
  details: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model("OTPAuditLog", otpAuditLogSchema);
