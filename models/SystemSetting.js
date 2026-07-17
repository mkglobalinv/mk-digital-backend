import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
    globalFeatures: {
        custom_domain: { type: Boolean, default: true },
        apk_generation: { type: Boolean, default: true },
        pwa_enabled: { type: Boolean, default: true },
        push_notifications: { type: Boolean, default: true },
        premium_analytics: { type: Boolean, default: true },
        ai_tools: { type: Boolean, default: false },
        playstore_publish: { type: Boolean, default: true },
        ios_app: { type: Boolean, default: false }
    },
    tierDefaults: {
        starter: {
            custom_domain: { type: Boolean, default: false },
            apk_generation: { type: Boolean, default: false },
            pwa_enabled: { type: Boolean, default: true }
        },
        premium: {
            custom_domain: { type: Boolean, default: true },
            apk_generation: { type: Boolean, default: true },
            pwa_enabled: { type: Boolean, default: true },
            premium_branding: { type: Boolean, default: true },
            dedicated_support: { type: Boolean, default: true }
        }
    },
    tierMargins: {
        basic: {
            airtime: { type: Number, default: 0.02 },
            cable: { type: Number, default: 0.01 },
            electricity: { type: Number, default: 0.01 },
            betting: { type: Number, default: 0.01 }
        },
        vip: {
            airtime: { type: Number, default: 0.025 },
            cable: { type: Number, default: 0.015 },
            electricity: { type: Number, default: 0.015 },
            betting: { type: Number, default: 0.015 }
        },
        premium: {
            airtime: { type: Number, default: 0.03 },
            cable: { type: Number, default: 0.02 },
            electricity: { type: Number, default: 0.02 },
            betting: { type: Number, default: 0.02 }
        }
    },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "system is currently under maintenance" },
    maintenanceTarget: { type: String, default: 'all', enum: ['all', 'reseller', 'customer', 'premium_reseller'] },
    allowNewResellers: { type: Boolean, default: true },
    activationFee: { type: Number, default: 5000 },
    trialDays: { type: Number, default: 7 },
    premiumPricing: {
        sixMonths: { type: Number, default: 20000 },
        yearly: { type: Number, default: 35000 }
    },
    estimatedAppDeliveryTime: { type: String, default: "72 hours" },
    infrastructure: {
        telemetryPollingInterval: { type: Number, default: 5000 },
        cleanupRetentionDays: { type: Number, default: 7 },
        maxApkVersionsPerReseller: { type: Number, default: 3 }
    },
    growthInfrastructure: {
        cashbackAmount: { type: Number, default: 2000 },
        retailReferralReward: { type: Number, default: 2000 },
        websiteOwnerReferralReward: { type: Number, default: 2000 },
        growthCampaignsEnabled: { type: Boolean, default: false }
    }
}, { timestamps: true });

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);

export default SystemSetting;
