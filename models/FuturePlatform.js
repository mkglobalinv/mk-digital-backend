import mongoose from "mongoose";

const futurePlatformSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  retailDisplayName: { type: String, required: true },
  ownerDisplayNameTemplate: { type: String, default: "{Brand}", required: false },
  logoUrl: { type: String, default: "" },
  url: { type: String, required: true },
  platformType: { type: String, enum: ["embedded", "external"], default: "embedded" },
  status: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("FuturePlatform", futurePlatformSchema);
