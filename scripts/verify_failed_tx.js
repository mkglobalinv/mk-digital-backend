import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

import Transaction from '../models/Transaction.js';
import DataPlan from '../models/DataPlan.js';

async function verifyFailedTx() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('Querying inactive MTN plans (orphaned)...');
        const orphanedPlans = await DataPlan.find({ network: 'MTN', provider: 'peyflex', status: false });
        
        // Map by both plan_name and api_plan_id to match descriptions
        const orphanedPlanIdentifiers = new Set();
        orphanedPlans.forEach(p => {
            orphanedPlanIdentifiers.add(p.api_plan_id.toLowerCase());
            // Sometimes description contains the name or parts of it, but mostly api_plan_id
            if (p.plan_name) orphanedPlanIdentifiers.add(p.plan_name.toLowerCase());
        });

        console.log('Querying failed MTN transactions via peyflex...');
        // Consider only recent ones to keep it relevant, e.g., last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const failedTx = await Transaction.find({
            network: 'MTN',
            provider: 'peyflex',
            status: 'failed',
            createdAt: { $gte: thirtyDaysAgo }
        });

        console.log(`Found ${failedTx.length} failed MTN transactions in the last 30 days.`);

        const matchedToOrphaned = [];
        const unmatched = [];

        for (const tx of failedTx) {
            const desc = tx.description ? tx.description.toLowerCase() : '';
            const apiResp = tx.api_response ? JSON.stringify(tx.api_response).toLowerCase() : '';
            
            let matched = false;
            for (const identifier of orphanedPlanIdentifiers) {
                if (desc.includes(identifier) || apiResp.includes(identifier)) {
                    matched = true;
                    break;
                }
            }
            
            if (matched) {
                matchedToOrphaned.push(tx);
            } else {
                unmatched.push(tx);
            }
        }

        let reportContent = `# Failed Transactions Verification Report\n\n`;
        reportContent += `Analyzed ${failedTx.length} failed MTN PayFlex transactions from the last 30 days.\n\n`;
        reportContent += `- **Linked to Missing/Outdated Plans:** ${matchedToOrphaned.length}\n`;
        reportContent += `- **Other Failures:** ${unmatched.length}\n\n`;
        
        if (matchedToOrphaned.length > 0) {
            reportContent += `## Samples of Failed Transactions Linked to Orphaned Plans\n\n`;
            matchedToOrphaned.slice(0, 10).forEach(tx => {
                reportContent += `- **Desc**: ${tx.description} | **Date**: ${tx.createdAt.toISOString()} | **Error**: ${tx.api_response ? JSON.stringify(tx.api_response) : 'N/A'}\n`;
            });
        }

        console.log(reportContent);

        // Optionally write to artifact directory if needed
        const reportPath = path.resolve('C:/Users/userpc/.gemini/antigravity/brain/9b5d5f65-d81f-47f1-a849-2c2b702634e3/failed_tx_verification.md');
        fs.writeFileSync(reportPath, reportContent, 'utf-8');
        console.log(`Report generated at ${reportPath}`);

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verifyFailedTx();
