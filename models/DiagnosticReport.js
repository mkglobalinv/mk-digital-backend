import mongoose from 'mongoose';

const diagnosticReportSchema = new mongoose.Schema({
    issueTitle: {
        type: String,
        required: true
    },
    failureType: {
        type: String, // 'Transaction', 'Webhook', 'Provider', 'Database'
        required: true
    },
    detectedAt: {
        type: Date,
        default: Date.now
    },
    rootCause: {
        type: String,
        required: true
    },
    confidenceScore: {
        type: Number, // 0 - 100
        required: true
    },
    affectedFiles: [{
        type: String
    }],
    affectedServices: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['Unresolved', 'Resolved'],
        default: 'Unresolved'
    },
    metadata: {
        transactionId: String,
        providerName: String,
        rawError: String
    }
}, { timestamps: true });

export default mongoose.model('DiagnosticReport', diagnosticReportSchema);
