import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import DataPlan from '../models/DataPlan.js';
import { fetchDataPlansFromPeyflex } from '../services/providers/peyflex.js';

const ARTIFACT_DIR = path.resolve('C:/Users/userpc/.gemini/antigravity/brain/9b5d5f65-d81f-47f1-a849-2c2b702634e3');
const PEYFLEX_ENDPOINTS = {
    'mtn_gifting_data': 'Gifting',
    'mtn_data_share': 'Data Share / Corporate',
    'mtn_awoof_gifting': 'Awoof'
};

async function runAudit() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB.');

        // Get all active MTN plans
        const dbPlans = await DataPlan.find({ network: 'MTN', status: true });
        console.log(`Fetched ${dbPlans.length} active MTN plans from DB.`);

        let livePeyflexPlans = new Map();
        for (const [endpoint, _] of Object.entries(PEYFLEX_ENDPOINTS)) {
            const res = await fetchDataPlansFromPeyflex(endpoint);
            if (res.success && res.plans) {
                res.plans.forEach(p => {
                    // map by plan_code (case-insensitive)
                    livePeyflexPlans.set(p.plan_code.toLowerCase(), { plan: p, endpoint });
                });
            }
        }
        
        console.log(`Fetched ${livePeyflexPlans.size} unique live plans from Peyflex.`);

        let report = `# Frontend MTN Display Audit\n\n`;
        report += `## Summary of Categories\n\n`;
        report += `You noticed the frontend displays: **Awoof, Corporate, Gifting, SME**.\n`;
        report += `Here is why these categories exist:\n\n`;
        report += `- **Gifting**: Maps directly to PayFlex \`mtn_gifting_data\`.\n`;
        report += `- **Awoof**: Maps directly to PayFlex \`mtn_awoof_gifting\`.\n`;
        report += `- **Corporate**: In the telecommunications API space, "Data Share" is commonly referred to as "Corporate Gifting" (CG) or "Corporate". PayFlex exposes \`mtn_data_share\`, which our system translates to the \`Corporate\` category for the end-user.\n`;
        report += `- **SME**: This category was previously tied to \`mtn_sme_data\` which returned a 404 error from PayFlex. However, if there are still plans displaying under this category, it means either: 1) They belong to another provider like ClubKonnect, or 2) They were not successfully deactivated in the database.\n\n`;
        
        report += `## Detailed Plan Audit\n\n`;
        report += `| DB Plan ID | Name | Provider | Provider Endpoint | API Plan ID | DB Category | Frontend Category | Exists in Live API? |\n`;
        report += `|---|---|---|---|---|---|---|---|\n`;

        let missingCount = 0;
        let clubkonnectCount = 0;

        for (const dbPlan of dbPlans) {
            const apiIdLower = dbPlan.api_plan_id.toString().toLowerCase();
            let endpoint = 'Unknown';
            let existsInLive = 'No';
            let mappedProvider = dbPlan.provider || 'unknown';

            if (mappedProvider.toLowerCase() === 'peyflex') {
                if (livePeyflexPlans.has(apiIdLower)) {
                    const liveData = livePeyflexPlans.get(apiIdLower);
                    endpoint = liveData.endpoint;
                    existsInLive = 'Yes';
                } else {
                    existsInLive = '❌ No (Missing/Orphaned)';
                    missingCount++;
                }
            } else if (mappedProvider.toLowerCase() === 'clubkonnect') {
                endpoint = 'clubkonnect_api';
                existsInLive = 'N/A (ClubKonnect)';
                clubkonnectCount++;
            }

            const frontendCategory = dbPlan.category;

            report += `| \`${dbPlan._id}\` | ${dbPlan.plan_name} | ${mappedProvider} | \`${endpoint}\` | \`${dbPlan.api_plan_id}\` | ${dbPlan.category} | ${frontendCategory} | ${existsInLive} |\n`;
        }

        report += `\n### Findings\n`;
        if (missingCount > 0) {
            report += `- **WARNING**: Found ${missingCount} active PayFlex plans that DO NOT exist in the live API. These will cause failed transactions and should be deactivated.\n`;
        } else {
            report += `- ✅ All active PayFlex plans currently exist in the live API.\n`;
        }

        if (clubkonnectCount > 0) {
            report += `- Found ${clubkonnectCount} ClubKonnect plans. If SME plans are displaying, they may belong to ClubKonnect.\n`;
        }

        const filename = `Frontend_MTN_Display_Audit.md`;
        fs.writeFileSync(path.join(ARTIFACT_DIR, filename), report, 'utf-8');
        
        console.log('Audit Generated.');
        process.exit(0);

    } catch (err) {
        console.error('Audit failed:', err);
        process.exit(1);
    }
}

runAudit();
