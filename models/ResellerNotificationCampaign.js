import mongoose from 'mongoose';

const resellerNotificationCampaignSchema = new mongoose.Schema({
    resellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    notificationType: {
        type: String,
        enum: ['Announcement', 'Promotion', 'Maintenance', 'Information'],
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

export default mongoose.model('ResellerNotificationCampaign', resellerNotificationCampaignSchema);
