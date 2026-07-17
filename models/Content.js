import mongoose from "mongoose";

const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["banner", "marquee", "post"],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
  },
  image: {
    type: String, // URL or base64
  },
  link: {
    type: String, // Action link
  },
  link_type: {
    type: String,
    enum: ["internal", "external"],
    default: "internal"
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  ownerType: {
    type: String,
    enum: ["admin", "reseller"],
    default: "admin"
  },
  resellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  forceGlobal: {
    type: Boolean,
    default: false
  },
  targetAudience: {
    type: String,
    enum: ["public", "customer", "reseller", "premium_reseller"],
    default: "public"
  },
  start_date: Date,
  end_date: Date,
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Content", contentSchema);
