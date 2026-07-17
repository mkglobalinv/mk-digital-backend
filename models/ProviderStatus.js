import mongoose from "mongoose";

const providerStatusSchema = new mongoose.Schema({
  providerName: { 
    type: String, 
    required: true, 
    unique: true 
  }, // 'peyflex', 'clubkonnect', 'reloadly'
  priority: {
    type: Number,
    default: 2
  },
  balance: { 
    type: Number, 
    default: 0 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  apiStatus: { 
    type: String, 
    default: 'online' 
  },
  latency: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  lastSuccessfulConnection: {
    type: Date,
    default: Date.now
  },
  isUnderMaintenance: {
    type: Boolean,
    default: false
  },
  maintenanceEvents: [{
    timestamp: { type: Date, default: Date.now },
    issue: String
  }],
  isAvailable: { 
    type: Boolean, 
    default: true 
  },
  manualDisabled: {
    type: Boolean,
    default: false
  },
  warningThreshold: { 
    type: Number, 
    default: 50000 
  },
  criticalThreshold: { 
    type: Number, 
    default: 10000 
  },
  pauseThreshold: { 
    type: Number, 
    default: 2000 
  },
  lastAlertSent: { 
    type: Date,
    default: null
  },
  lastCriticalAlertSent: { 
    type: Date,
    default: null
  },
  lastExhaustedAlertSent: {
    type: Date,
    default: null
  },
  lastOfflineAlertSent: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model("ProviderStatus", providerStatusSchema);
