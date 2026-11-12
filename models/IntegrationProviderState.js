import mongoose from "mongoose";

// Last connection-test result per integration (System Settings dashboard).
const integrationProviderStateSchema = new mongoose.Schema({
    provider: { type: String, required: true, unique: true },
    lastTest: {
        status: { type: String, enum: ["connected", "failed"] },
        message: String,
        at: Date,
        byEmail: String
    }
}, { timestamps: true });

export default mongoose.model("IntegrationProviderState", integrationProviderStateSchema);
