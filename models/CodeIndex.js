import mongoose from 'mongoose';

const codeIndexSchema = new mongoose.Schema({
    filePath: {
        type: String,
        required: true,
        unique: true
    },
    fileType: {
        type: String, // 'model', 'route', 'controller', 'service', 'other'
        required: true
    },
    contentHash: {
        type: String,
        required: true
    },
    metadata: {
        extractedRoutes: [String],
        dependencies: [String],
        relatedProviders: [String] // e.g., 'flutterwave', 'peyflex'
    },
    lastIndexedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('CodeIndex', codeIndexSchema);
