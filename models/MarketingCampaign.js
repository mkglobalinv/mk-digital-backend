import mongoose from "mongoose";

const marketingCampaignSchema = new mongoose.Schema({
  campaignType: { 
    type: String, 
    enum: ['Promotion', 'Announcement', 'Blog', 'Referral', 'Advertisement'], 
    default: 'Promotion' 
  },
  title: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String },
  price: { type: String },
  badgeText: { type: String },
  icon: { type: String, default: 'Zap' },
  bgColor: { type: String, default: '#ffffff' },
  gradientColor: { type: String, default: '' },
  buttonText: { type: String, default: 'View' },
  actionType: { 
    type: String, 
    enum: [
      "Open Data Page", "Open Airtime Page", "Open Cable TV Page", 
      "Open Electricity Page", "Open Registration Page", "Open WhatsApp", 
      "Open Service Category", "Open External Link", "Open Internal Route", "Custom URL", "None"
    ],
    default: "Open Data Page"
  },
  actionUrl: { type: String },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  displayMode: { type: String, enum: ["Dashboard Grid Only", "Popup Only", "Both", "Hidden"], default: "Dashboard Grid Only" },
  targetAudience: { 
    type: String, 
    enum: ['Retail Users', 'Resellers', 'Reseller Customers', 'All Users'], 
    default: 'All Users' 
  },
  
  // Shared text / HTML content (Announcement, Blog, Referral Description)
  content: { type: String }, 
  
  // Announcement Specific
  priority: { type: String, enum: ['Info', 'Warning', 'Critical'], default: 'Info' },
  
  // Blog Specific
  featuredImage: { type: String },
  category: { type: String },
  author: { type: String },
  tags: { type: [String] },
  seoTitle: { type: String },
  seoDescription: { type: String },
  
  // Referral Specific
  referralBonus: { type: String },
  termsConditions: { type: String },
  
  // Advertisement Specific
  advertiserName: { type: String },
  displayPosition: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  sortOrder: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  lastClickDate: { type: Date }
}, { timestamps: true });

export default mongoose.model("MarketingCampaign", marketingCampaignSchema);
