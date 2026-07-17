import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { smartBuyData } from '../services/switcher.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import DataPlan from '../models/DataPlan.js';

const ARTIFACT_DIR = path.resolve('C:/Users/userpc/.gemini/antigravity/brain/9b5d5f65-d81f-47f1-a849-2c2b702634e3');
const TEST_PHONE = '08012345678'; // Use standard test number

async function runTests() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB.');

        const networks = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];
        let report = `# Multi-Network Architecture Test Report\n\n`;
        report += `This report verifies end-to-end data purchases across all networks on the newly simplified routing architecture (ConnectBridge disabled).\n\n`;
        report += `| Network | Plan Name | Provider | Result | Reference |\n`;
        report += `|---|---|---|---|---|\n`;

        for (const net of networks) {
            console.log(`\n--- Testing ${net} ---`);
            const plan = await DataPlan.findOne({ network: net, status: true }).sort({ api_price: 1 });
            
            if (!plan) {
                console.log(`No active plans found for ${net}.`);
                report += `| ${net} | N/A | N/A | ❌ NO ACTIVE PLANS | N/A |\n`;
                continue;
            }

            console.log(`Selected Plan: ${plan.plan_name} (ID: ${plan.api_plan_id}, Provider: ${plan.provider})`);
            
            // Execute the purchase via the switcher
            const result = await smartBuyData(net, plan.api_plan_id, TEST_PHONE, plan.api_price || 100, 'NG', null, null, 'smart', plan.category);
            
            console.log(`Result:`, result);

            const statusIcon = result.status === 'success' ? '✅ SUCCESS' : '❌ FAILED';
            report += `| ${net} | ${plan.plan_name} | ${plan.provider} | ${statusIcon} | \`${result.reference || result.message}\` |\n`;
        }

        const filename = `MultiNetwork_Test_Report.md`;
        fs.writeFileSync(path.join(ARTIFACT_DIR, filename), report, 'utf-8');
        
        console.log('\nTesting Complete. Report generated.');
        process.exit(0);

    } catch (err) {
        console.error('Testing failed:', err);
        process.exit(1);
    }
}

runTests();
