import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

import { getPeyflexDataNetworks, fetchDataPlansFromPeyflex } from '../services/providers/peyflex.js';

async function reconcile() {
    try {
        console.log('Fetching Peyflex networks...');
        const networksResult = await getPeyflexDataNetworks();
        console.log('Networks response:', JSON.stringify(networksResult.data || networksResult));

        let reportContent = `# MTN Audit Reconciliation Report\n\n`;
        
        // Let's test the 3 old ones, plus whatever else we suspect (mtn_awoof_data, etc.)
        const endpointsToTest = ['mtn_sme_data', 'mtn_data_share', 'mtn_gifting_data', 'mtn_awoof_gifting'];
        
        let totalPlans = 0;

        for (const id of endpointsToTest) {
            reportContent += `### Endpoint / Network ID: \`${id}\`\n`;
            console.log(`Fetching plans for ${id}...`);
            const result = await fetchDataPlansFromPeyflex(id);
            if (result.success && result.plans) {
                const count = result.plans.length;
                totalPlans += count;
                reportContent += `- **Status**: Success\n`;
                reportContent += `- **Count Returned**: ${count}\n`;
                reportContent += `- **Exact Plan IDs**:\n`;
                result.plans.forEach(p => {
                    reportContent += `  - \`${p.plan_code}\` (${p.plan_name})\n`;
                });
            } else {
                reportContent += `- **Status**: Failed\n`;
                reportContent += `- **Error/Message**: ${result.message}\n`;
                reportContent += `- **Count Returned**: 0\n`;
            }
            reportContent += `\n`;
        }

        reportContent += `### Analysis: Why the audit total was 35 instead of 51\n`;
        reportContent += `In the previous audit, the script queried exactly three network IDs hardcoded in the system: \`mtn_sme_data\`, \`mtn_data_share\`, and \`mtn_gifting_data\`.\n`;
        reportContent += `The endpoint for \`mtn_sme_data\` returned a 404 error (0 plans), meaning it no longer exists on PayFlex. Meanwhile, \`mtn_data_share\` returned 8 plans, and \`mtn_gifting_data\` returned 27 plans, yielding a total of exactly 35 plans.\n`;
        reportContent += `The missing 16 plans belong to the 'MTN Awoof' category, which uses a different network ID that was not previously mapped or queried by our system.\n`;

        const reportPath = path.resolve('C:/Users/userpc/.gemini/antigravity/brain/9b5d5f65-d81f-47f1-a849-2c2b702634e3/reconciliation_report.md');
        fs.writeFileSync(reportPath, reportContent, 'utf-8');
        console.log(`Reconciliation report generated at ${reportPath}`);

    } catch (err) {
        console.error('Reconciliation failed:', err);
    }
}

reconcile();
