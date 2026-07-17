import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const duplicates = await User.aggregate([
        { $group: { _id: { $toLower: "$email" }, count: { $sum: 1 }, docs: { $push: "$$ROOT" } } },
        { $match: { count: { $gt: 1 } } }
    ]);

    let markdown = `# Duplicate Account Audit Report\n\n`;

    for (const dup of duplicates) {
        markdown += `## Email: \`${dup._id}\` (Count: ${dup.count})\n\n`;
        
        let primaryId = null;
        let primaryReason = "";
        let maxWeight = -1;
        let latestDate = new Date(0);

        for (const doc of dup.docs) {
            let weight = 0;
            let reasonParts = [];

            if (doc.role === 'superadmin') { weight += 100; reasonParts.push('Super Admin'); }
            else if (doc.role === 'admin') { weight += 80; reasonParts.push('Admin'); }
            else if (doc.role === 'reseller_admin') { weight += 60; reasonParts.push('Website Owner (reseller_admin)'); }
            
            if (doc.isResellerActivated) { weight += 20; reasonParts.push('Active Subscription/Activation'); }
            if (doc.resellerTier === 'premium' || doc.resellerTier === 'vip') { weight += 10; reasonParts.push('Premium Tier'); }
            if (doc.totalBalance > 0 || doc.earningsBalance > 0) { weight += 5; reasonParts.push('Has Balances'); }

            const updatedDate = doc.updatedAt ? new Date(doc.updatedAt) : new Date(0);
            
            if (weight > maxWeight || (weight === maxWeight && updatedDate > latestDate)) {
                maxWeight = weight;
                primaryId = doc._id.toString();
                primaryReason = reasonParts.join(', ') || 'Most Recent Activity';
                latestDate = updatedDate;
            }
            
            markdown += `### ID: \`${doc._id}\` ${doc._id.toString() === primaryId ? '⭐ **(PRIMARY CANDIDATE)**' : ''}\n`;
            markdown += `- **Role:** ${doc.role}\n`;
            markdown += `- **Wallet Balance:** ₦${doc.totalBalance || 0}\n`;
            markdown += `- **Earnings Balance:** ₦${doc.earningsBalance || 0}\n`;
            markdown += `- **Referral Code:** ${doc.referralCode || 'N/A'}\n`;
            markdown += `- **Referred By:** ${doc.referredBy || 'N/A'}\n`;
            markdown += `- **Website Name:** ${doc.branding?.siteName || doc.admin_subdomain || 'N/A'}\n`;
            markdown += `- **Website Owner Status:** ${doc.resellerActivationStatus || 'none'}\n`;
            markdown += `- **Subscription Status:** ${doc.isResellerActivated ? 'Active' : 'Inactive'} (Tier: ${doc.resellerTier})\n`;
            markdown += `- **Activation Status:** ${doc.activationRewardGiven ? 'Reward Given' : 'No Reward'}\n`;
            markdown += `- **Created Date:** ${doc.createdAt || 'N/A'}\n`;
            markdown += `- **Updated Date:** ${doc.updatedAt || 'N/A'}\n\n`;
        }

        markdown += `> [!TIP]\n> **Primary Account Identified:** \`${primaryId}\`\n> **Reasoning:** ${primaryReason}\n\n`;
        markdown += `---\n\n`;
    }

    const fs = await import('fs');
    fs.writeFileSync('C:/Users/userpc/.gemini/antigravity-ide/brain/b5862db6-6420-4865-8a19-d56bf70cb533/duplicate_account_audit.md', markdown);

    await mongoose.disconnect();
}

run().catch(console.error);
