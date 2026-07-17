import mongoose from "mongoose";

const marketingAnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { type: String, enum: ['Info', 'Warning', 'Critical'], default: 'Info' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  startDate: { type: Date },
  endDate: { type: Date },
  views: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("MarketingAnnouncement", marketingAnnouncementSchema);
