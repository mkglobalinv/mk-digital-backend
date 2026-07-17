import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import DataPlan from '../models/DataPlan.js';
import { fetchDataPlansFromPeyflex } from '../services/providers/peyflex.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAudit() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const networkIdentifiers = ['mtn_sme_data', 'mtn_data_share', 'mtn_gifting_data'];
        let livePlans = [];

        console.log('Fetching live PayFlex MTN plans...');
        for (const id of networkIdentifiers) {
            const result = await fetchDataPlansFromPeyflex(id);
            if (result.success && result.plans) {
                livePlans.push(...result.plans);
            } else {
                console.warn(`Failed to fetch plans for ${id}:`, result.message);
            }
        }

        const livePlanMap = new Map();
        livePlans.forEach(plan => {
            // the live plan_code is what we use as api_plan_id
            livePlanMap.set(plan.plan_code.toString().toLowerCase(), plan);
        });

        console.log(`Fetched ${livePlans.length} live plans.`);

        console.log('Fetching database MTN PayFlex plans...');
        const dbPlans = await DataPlan.find({ network: 'MTN', provider: 'peyflex' });
        console.log(`Found ${dbPlans.length} plans in the database.`);

        const orphanedPlans = [];
        let reportContent = `# MTN PayFlex Plans Audit Report\n\n`;
        reportContent += `| Plan Name | DB ProviderPlanId | Live ProviderPlanId | DB Price | Live Price | Exists in Live API |\n`;
        reportContent += `|---|---|---|---|---|---|\n`;

        for (const plan of dbPlans) {
            const apiPlanIdLower = plan.api_plan_id.toString().toLowerCase();
            const livePlan = livePlanMap.get(apiPlanIdLower);
            
            const exists = !!livePlan;
            const livePlanId = exists ? livePlan.plan_code : 'N/A';
            const livePrice = exists ? livePlan.price : 'N/A';
            
            reportContent += `| ${plan.plan_name} | \`${plan.api_plan_id}\` | \`${livePlanId}\` | ₦${plan.api_price} | ${livePrice !== 'N/A' ? '₦' + livePrice : 'N/A'} | ${exists ? 'Yes' : '**No**'} |\n`;
            
            if (!exists) {
                orphanedPlans.push(plan);
            }
        }

        reportContent += `\n\n## Orphaned Plans Summary\n\n`;
        if (orphanedPlans.length === 0) {
            reportContent += `No orphaned plans found. All database plans exist in the live PayFlex API.\n`;
        } else {
            reportContent += `Found **${orphanedPlans.length}** orphaned plans that exist in our database but NO LONGER exist in the live PayFlex API.\n\n`;
            for (const p of orphanedPlans) {
                reportContent += `- **${p.plan_name}** (\`${p.api_plan_id}\`)\n`;
            }
        }

        const reportPath = path.resolve('C:/Users/userpc/.gemini/antigravity/brain/9b5d5f65-d81f-47f1-a849-2c2b702634e3/audit_report.md');
        fs.writeFileSync(reportPath, reportContent, 'utf-8');
        console.log(`Report generated at ${reportPath}`);

        // Update DB
        if (orphanedPlans.length > 0) {
            console.log(`Deactivating ${orphanedPlans.length} orphaned plans...`);
            for (const p of orphanedPlans) {
                // Ensure we actually update and save
                p.status = false;
                await p.save();
                console.log(`Deactivated ${p.plan_name} (${p.api_plan_id})`);
            }
        }

        console.log('Audit complete.');
    } catch (err) {
        console.error('Audit failed:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runAudit();
