import mongoose from "mongoose";

const plotSchema = new mongoose.Schema({
  plotNumber: { type: String, required: true, unique: true },
  size: { type: String, default: "20x40" },
  price: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["available", "reserved", "sold"], 
    default: "available" 
  },
  category: { 
    type: String, 
    enum: ["residential", "commercial"], 
    default: "residential" 
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  coordinates: {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    path: String // For complex shapes
  }
}, { timestamps: true });

export default mongoose.model("Plot", plotSchema);
