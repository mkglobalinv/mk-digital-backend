import mongoose from "mongoose";

// Who changed which integration setting and when. Never stores values.
const integrationAuditLogSchema = new mongoose.Schema({
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorEmail: String,
    action: { type: String, enum: ["setting.updated", "setting.cleared", "provider.enabled", "provider.disabled", "provider.tested"], required: true },
    target: { type: String, required: true }, // setting key or provider id
    detail: String,                           // non-secret context, e.g. "Connected" / "Failed"
    ip: String
}, { timestamps: { createdAt: true, updatedAt: false } });

integrationAuditLogSchema.index({ createdAt: -1 });

export default mongoose.model("IntegrationAuditLog", integrationAuditLogSchema);
