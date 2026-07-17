import mongoose from "mongoose";

const promotionGridSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String },
  price: { type: String },
  badgeText: { type: String },
  bgColor: { type: String, default: "#ffffff" },
  gradientColor: { type: String, default: "" },
  icon: { type: String, default: "Zap" },
  buttonText: { type: String, default: "View" },
  actionType: { 
    type: String, 
    enum: [
      "Open Data Page", "Open Airtime Page", "Open Cable TV Page", 
      "Open Electricity Page", "Open Registration Page", "Open WhatsApp", 
      "Open Service Category", "Open External Link", "Open Internal Route", "Custom URL"
    ],
    default: "Open Data Page"
  },
  actionUrl: { type: String },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  displayMode: { type: String, enum: ["Dashboard Grid Only", "Popup Only", "Both", "Hidden"], default: "Dashboard Grid Only" },
  startDate: { type: Date },
  endDate: { type: Date },
  sortOrder: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  lastClickDate: { type: Date }
}, { timestamps: true });

export default mongoose.model("PromotionGrid", promotionGridSchema);
