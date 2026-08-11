import mongoose from 'mongoose';

const manualApplicationSchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true },
  websiteId: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceType: { type: String, required: true }, // 'nin_modification', 'bvn_modification', 'cac_registration'
  status: { type: String, enum: ['submitted', 'processing', 'completed', 'failed'], default: 'submitted' },
  submittedData: { type: mongoose.Schema.Types.Mixed },
  commissionStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  commissionAmount: { type: Number, default: 0 },
  submissionTimestamp: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, {
  timestamps: true
});

export default mongoose.model('ManualApplication', manualApplicationSchema);
