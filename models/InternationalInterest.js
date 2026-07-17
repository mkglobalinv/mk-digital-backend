import mongoose from "mongoose";

const internationalInterestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  serviceType: String, // airtime or data
  country: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("InternationalInterest", internationalInterestSchema);
