import mongoose from 'mongoose';

const DeploymentAuditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        enum: ['SNAPSHOT_CREATED', 'SNAPSHOT_RESTORED', 'ROLLBACK', 'GIT_FETCH', 'RECOVERY', 'FAILED_OPERATION', 'SNAPSHOT_DELETED'],
        required: true
    },
    user: {
        type: String,
        required: true
    },
    targetCommit: {
        type: String,
        default: null
    },
    targetSnapshot: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED'],
        required: true
    },
    resultMessage: {
        type: String,
        required: true
    },
    durationMs: {
        type: Number
    },
    collectionsRestored: {
        type: [String]
    },
    collectionsSkipped: {
        type: [String]
    },
    automaticRollbackPerformed: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('DeploymentAuditLog', DeploymentAuditLogSchema);
