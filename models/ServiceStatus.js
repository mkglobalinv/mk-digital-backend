import mongoose from "mongoose";

const serviceStatusSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  statusType: { 
    type: String, 
    enum: ['active', 'delayed', 'maintenance', 'informational'], 
    default: 'active' 
  },
  statusMessage: { type: String, required: true },
  severityColor: { 
    type: String, 
    enum: ['green', 'yellow', 'red', 'blue'], 
    default: 'green' 
  },
  targetAudience: { 
    type: String, 
    enum: ['all', 'customer', 'reseller', 'premium_reseller'], 
    default: 'all' 
  },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, {
  timestamps: true
});

export default mongoose.model("ServiceStatus", serviceStatusSchema);
