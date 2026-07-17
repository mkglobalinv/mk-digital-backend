import mongoose from 'mongoose';

const apiLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    endpoint: {
        type: String,
        required: true
    },
    method: {
        type: String,
        required: true
    },
    requestBody: {
        type: Object
    },
    responseBody: {
        type: Object
    },
    statusCode: {
        type: Number
    },
    ipAddress: {
        type: String
    },
    responseTime: {
        type: Number // in ms
    },
    error: {
        type: String
    }
}, { timestamps: true });

apiLogSchema.index({ userId: 1, createdAt: -1 });
apiLogSchema.index({ createdAt: -1 });

const ApiLog = mongoose.model('ApiLog', apiLogSchema);

export default ApiLog;
