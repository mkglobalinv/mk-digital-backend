import mongoose from "mongoose";

const systemNotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  target: { type: String, enum: ['all', 'individual'], default: 'all' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Required if target is 'individual'
  type: { type: String, enum: ['info', 'warning', 'success'], default: 'info' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("SystemNotification", systemNotificationSchema);
