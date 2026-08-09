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

    // Profit & Multi-Tenant Tracking
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resellerTierAtPurchase: { type: String, enum: ['basic', 'premium', 'vip', null], default: null },
    underlyingCost: { type: Number, default: null },
    grossProfit: { type: Number, default: 0 },
    resellerProfitShare: { type: Number, default: 0 }, // e.g. 0.30 or 0.60
    resellerProfitAmount: { type: Number, default: 0 },
    platformProfitShare: { type: Number, default: 0 },
    platformProfitAmount: { type: Number, default: 0 },
    profitDistributed: { type: Boolean, default: false },

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
