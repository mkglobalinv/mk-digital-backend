import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import DataPlan from '../models/DataPlan.js';

const ARTIFACT_DIR = path.resolve('C:/Users/userpc/.gemini/antigravity/brain/9b5d5f65-d81f-47f1-a849-2c2b702634e3');

async function verifyArchitecture() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB.');

        const activeCbPlans = await DataPlan.countDocuments({ provider: 'connectbridge', status: true });
        
        const allActivePlans = await DataPlan.find({ status: true });
        let providers = new Set();
        allActivePlans.forEach(p => providers.add(p.provider));

        let report = `# Architecture Verification Report\n\n`;
        report += `## ConnectBridge Status\n`;
        if (activeCbPlans === 0) {
            report += `✅ SUCCESS: There are exactly **0** active ConnectBridge plans in the database.\n\n`;
        } else {
            report += `❌ FAILURE: Found ${activeCbPlans} active ConnectBridge plans in the database.\n\n`;
        }

        report += `## Active Providers\n`;
        report += `The following providers currently have active plans visible on the frontend:\n`;
        Array.from(providers).forEach(prov => {
            const count = allActivePlans.filter(p => p.provider === prov).length;
            report += `- **${prov}**: ${count} active plans\n`;
        });

        const allowedProviders = ['peyflex', 'clubkonnect', 'reloadly'];
        let hasUnauthorized = false;
        Array.from(providers).forEach(prov => {
            if (!allowedProviders.includes(prov.toLowerCase())) {
                hasUnauthorized = true;
                report += `\n❌ WARNING: Unauthorized provider '${prov}' is still active!`;
            }
        });

        if (!hasUnauthorized) {
            report += `\n✅ SUCCESS: Only authorized providers (PayFlex, ClubKonnect, Reloadly) are currently active in the system.`;
        }

        const filename = `Architecture_Verification.md`;
        fs.writeFileSync(path.join(ARTIFACT_DIR, filename), report, 'utf-8');
        
        console.log('Verification Complete.');
        process.exit(0);

    } catch (err) {
        console.error('Verification failed:', err);
        process.exit(1);
    }
}

verifyArchitecture();
