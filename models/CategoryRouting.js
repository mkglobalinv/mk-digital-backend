import mongoose from 'mongoose';

const categoryRoutingSchema = new mongoose.Schema({
  global_category_name: {
    type: String,
    required: true,
    unique: true // e.g., 'MTN SME'
  },
  primary_provider: {
    type: String,
    required: true // e.g., 'peyflex'
  },
  fallback_provider: {
    type: String,
    default: '' // e.g., 'clubkonnect'
  },
  backup_provider: {
    type: String,
    default: '' // e.g., 'future_provider'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'MAINTENANCE', 'DISABLED'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

export default mongoose.model('CategoryRouting', categoryRoutingSchema);
