import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import DataPlan from '../models/DataPlan.js';

const ARTIFACT_DIR = path.resolve('C:/Users/userpc/.gemini/antigravity/brain/9b5d5f65-d81f-47f1-a849-2c2b702634e3');

async function runAudit() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB.');

        const cbPlans = await DataPlan.find({ provider: 'connectbridge', status: true });
        console.log(`Fetched ${cbPlans.length} active ConnectBridge plans.`);

        let networks = new Set();
        let categories = new Set();

        cbPlans.forEach(p => {
            networks.add(p.network.toUpperCase());
            if (p.category) categories.add(p.category);
        });

        let report = `# ConnectBridge Provider Audit\n\n`;
        report += `## Summary of Usage\n\n`;
        report += `- **Total Active Plans**: ${cbPlans.length}\n`;
        report += `- **Networks Affected**: ${Array.from(networks).join(', ') || 'None'}\n`;
        report += `- **Categories Affected**: ${Array.from(categories).join(', ') || 'None'}\n\n`;

        report += `## Routing & Fallback Analysis\n\n`;
        report += `Based on a codebase scan (\`services/switcher.js\`, \`services/providerMonitoringService.js\`):\n`;
        report += `- **Active Routing Rules**: There are no explicit routing rules pointing to \`connectbridge\`. In fact, \`services/switcher.js\` assumes any unrecognized provider is \`peyflex\`. If a customer attempts to purchase one of these active ConnectBridge plans, the system defaults to routing it through PayFlex, which fails since the plan ID belongs to ConnectBridge.\n`;
        report += `- **Fallback Rules**: There is no secondary fallback logic pointing to ConnectBridge. Fallbacks exclusively rotate between \`peyflex\` and \`clubkonnect\`.\n\n`;
        
        report += `## Detailed Plan List\n\n`;
        report += `| Network | Name | API Plan ID | Category |\n`;
        report += `|---|---|---|---|\n`;

        cbPlans.forEach(p => {
            report += `| ${p.network} | ${p.plan_name} | \`${p.api_plan_id}\` | ${p.category} |\n`;
        });

        const filename = `ConnectBridge_Audit.md`;
        fs.writeFileSync(path.join(ARTIFACT_DIR, filename), report, 'utf-8');
        
        console.log('Audit Generated.');
        process.exit(0);

    } catch (err) {
        console.error('Audit failed:', err);
        process.exit(1);
    }
}

runAudit();
