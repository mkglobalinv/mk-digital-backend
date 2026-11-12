import mongoose from "mongoose";

// One document per configuration value managed from System Settings ->
// Integrations & API Configuration. `value` is always AES-256-GCM ciphertext
// (services/settings/secretCrypto.js); plaintext is never stored.
const integrationCredentialSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: {
        v: Number,
        kid: String,
        iv: String,
        tag: String,
        ct: String
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedByEmail: String
}, { timestamps: true });

export default mongoose.model("IntegrationCredential", integrationCredentialSchema);
