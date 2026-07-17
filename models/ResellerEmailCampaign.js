import mongoose from 'mongoose';

const resellerEmailCampaignSchema = new mongoose.Schema({
    resellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    recipientType: {
        type: String,
        enum: ['all', 'active', 'selected'],
        required: true
    },
    recipientCount: {
        type: Number,
        default: 0
    },
    successCount: {
        type: Number,
        default: 0
    },
    failedCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    }
}, { timestamps: true });

export default mongoose.model('ResellerEmailCampaign', resellerEmailCampaignSchema);
