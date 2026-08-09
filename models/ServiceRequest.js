import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
    storageKey: { type: String, required: true },
    documentType: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const serviceRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    serviceType: { type: String, required: true },
    reference: { type: String, required: true, unique: true },
    whatsappNumber: { type: String, required: true },
    submittedData: { type: mongoose.Schema.Types.Mixed, default: {} },
    documents: [documentSchema],
    amount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ["PENDING_REVIEW", "IN_PROGRESS", "COMPLETED", "REJECTED"], 
        default: "PENDING_REVIEW" 
    },
    expectedProcessingTime: { type: String },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    adminNotes: { type: String, default: "" }
}, { 
    timestamps: true 
});

// Operational lookup indexes for speedy resolution
serviceRequestSchema.index({ userId: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ serviceType: 1 });

export default mongoose.model("ServiceRequest", serviceRequestSchema);
