import mongoose from "mongoose";

const maintenanceLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    required: true,
    enum: [
        'LOGIN', 
        'SETTINGS_CHANGE', 
        'PROVIDER_CHANGE', 
        'DEPLOYMENT_ACTION', 
        'MAINTENANCE_ACTION', 
        'ROLLBACK_ACTION',
        'DIAGNOSTIC_RUN'
    ]
  },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  status: { type: String, enum: ['SUCCESS', 'FAILED', 'IN_PROGRESS'], default: 'SUCCESS' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("MaintenanceLog", maintenanceLogSchema);
