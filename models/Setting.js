import mongoose from "mongoose";

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., 'vtu_services', 'app_banners', 'pricing'
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model("Setting", settingSchema);
