import mongoose from "mongoose";

const emergencyRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  phone: { type: String, required: true },
  network: { type: String, required: true },
  planId: { type: String, required: true },
  rawSms: { type: String },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rejectionReason: { type: String },
  cashbackAmount: { type: Number, default: 0 },
  amountCharged: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("EmergencyRequest", emergencyRequestSchema);
