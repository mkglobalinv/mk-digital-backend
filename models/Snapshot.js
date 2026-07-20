import mongoose from 'mongoose';

const SnapshotSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
        unique: true
    },
    notes: {
        type: String,
        default: ''
    },
    commitHash: {
        type: String,
        default: 'unknown'
    },
    creator: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    checksum: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Snapshot', SnapshotSchema);
