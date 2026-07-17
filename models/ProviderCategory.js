import mongoose from 'mongoose';

const providerCategorySchema = new mongoose.Schema({
  provider_name: {
    type: String,
    required: true
  },
  category_name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'MAINTENANCE', 'DISABLED'],
    default: 'ACTIVE'
  },
  visibility: {
    type: String,
    enum: ['VISIBLE', 'HIDDEN'],
    default: 'VISIBLE'
  },
  maintenance_message: {
    type: String,
    default: ''
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

providerCategorySchema.index({ provider_name: 1, category_name: 1 }, { unique: true });

export default mongoose.model('ProviderCategory', providerCategorySchema);
