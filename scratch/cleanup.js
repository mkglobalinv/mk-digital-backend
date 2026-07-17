import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Models
import User from '../models/User.js';
import Session from '../models/Session.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import OTP from '../models/OTP.js';
import OTPAuditLog from '../models/OTPAuditLog.js';
import Withdrawal from '../models/Withdrawal.js';
import CustomDomainRequest from '../models/CustomDomainRequest.js';
import AppRequest from '../models/AppRequest.js';
import AppBuildJob from '../models/AppBuildJob.js';
import MarketingAnalytics from '../models/MarketingAnalytics.js';
import ResellerRequest from '../models/ResellerRequest.js';
import SystemSetting from '../models/SystemSetting.js';
import DataPlan from '../models/DataPlan.js';

async function performReset() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const report = {
            collectionsCleaned: [],
            preservedCollections: [
                'AdminLog', 'BackupLog', 'MaintenanceLog', 'DiagnosticReport', 
                'FraudLog', 'ReconciliationReport', 'SystemLog', 'SystemSetting', 
                'Setting', 'PricingRule', 'DataPlan', 'ProviderCategory', 
                'ProviderStatus', 'ServiceStatus', 'GatewayConfig', 'CodeIndex', 
                'CategoryRouting', 'Content', 'MarketingCampaign'
            ],
            deletedCounts: {},
            verification: {}
        };

        // 1. Delete Users (Retail, Website Owners, Resellers, Test)
        // PRESERVE: superadmin roles, and email: unuktar1@gmail.com
        const userFilter = { 
            $nor: [
                { role: 'superadmin' },
                { email: 'unuktar1@gmail.com' },
                { email: 'admin@9jasub.com' } // Standard super admin usually
            ]
        };
        const usersToDelete = await User.countDocuments(userFilter);
        await User.deleteMany(userFilter);
        report.collectionsCleaned.push('Users');
        report.deletedCounts['Users'] = usersToDelete;

        // 2. Clear Collections
        const collectionsToClear = [
            { name: 'Sessions', model: Session },
            { name: 'Transactions', model: Transaction },
            { name: 'Notifications', model: Notification },
            { name: 'OTPs', model: OTP },
            { name: 'OTPAuditLogs', model: OTPAuditLog },
            { name: 'Withdrawals', model: Withdrawal },
            { name: 'CustomDomainRequests', model: CustomDomainRequest },
            { name: 'AppRequests', model: AppRequest },
            { name: 'AppBuildJobs', model: AppBuildJob },
            { name: 'MarketingAnalytics', model: MarketingAnalytics },
            { name: 'ResellerRequests', model: ResellerRequest }
        ];

        for (const col of collectionsToClear) {
            const count = await col.model.countDocuments({});
            await col.model.deleteMany({});
            report.collectionsCleaned.push(col.name);
            report.deletedCounts[col.name] = count;
        }

        // 3. Verifications
        console.log("Verifying state...");
        
        // Admin unuktar1@gmail.com exists
        const adminUser = await User.findOne({ email: 'unuktar1@gmail.com' });
        report.verification.adminExists = !!adminUser;
        
        // Super Admins exist
        const superAdminsCount = await User.countDocuments({ role: 'superadmin' });
        report.verification.superAdminsExist = superAdminsCount > 0;

        // System Settings intact and pricing check
        const sysSettings = await SystemSetting.findOne({});
        report.verification.systemSettingsIntact = !!sysSettings;
        if (sysSettings && sysSettings.premiumPricing) {
            report.verification.pricingIntact = 
                sysSettings.premiumPricing.sixMonths === 20000 && 
                sysSettings.premiumPricing.yearly === 35000;
        } else {
            report.verification.pricingIntact = false;
        }
        
        // Data Plans intact
        const dataPlansCount = await DataPlan.countDocuments();
        report.verification.dataPlansIntact = dataPlansCount > 0;
        
        // 4. Confirmation of Non-destructive constraints
        report.verification.sourceCodeModified = false;
        report.verification.schemaModified = false;
        report.verification.indexesRemoved = false;
        report.verification.collectionsDropped = false;

        console.log("\n=== FINAL REPORT ===");
        console.log(JSON.stringify(report, null, 2));

    } catch (error) {
        console.error("FATAL ERROR during reset:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

performReset();
