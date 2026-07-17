import mongoose from "mongoose";
import { getSupabaseClient } from '../services/supabaseClient.js';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["otp", "transaction", "system", "warning", "success"],
    default: "system"
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

notificationSchema.post('save', async function(doc) {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('notifications').insert([{
        user_id: doc.userId.toString(),
        title: doc.title,
        message: doc.message,
        type: doc.type,
        is_read: doc.isRead
      }]);
    }
  } catch (err) {
    console.error('[Supabase Sync] Failed to sync notification:', err);
  }
});

export default mongoose.model("Notification", notificationSchema);
