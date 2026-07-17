import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  amount: Number,
  type: String, // credit or debit
  status: { type: String, default: 'success' }, // pending, success, failed
  reference: { type: String, unique: true, sparse: true }, // unique Paystack/VTPass ref
  description: String,
  phone: String,
  network: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Transaction", transactionSchema);