import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

import DataPlan from '../models/DataPlan.js';
import { fetchDataPlansFromPeyflex } from '../services/providers/peyflex.js';
import { fetchDataPlansFromClubkonnect } from '../services/providers/clubkonnect.js';

const ARTIFACT_DIR = path.resolve('C:/Users/userpc/.gemini/antigravity/brain/9b5d5f65-d81f-47f1-a849-2c2b702634e3');

const PEYFLEX_NETWORKS = {
    'MTN': ['mtn_sme_data', 'mtn_data_share', 'mtn_gifting_data', 'mtn_awoof_gifting'],
    'GLO': ['glo_data'],
    'AIRTEL': ['airtel_data'],
    '9MOBILE': ['9mobile_data']
};

const CK_NETWORKS = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];

async function runFullAudit() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB.');

        const dbPlans = await DataPlan.find({});
        console.log(`Fetched ${dbPlans.length} total plans from DB.`);

        const livePlans = { peyflex: {}, clubkonnect: {} };

        // Fetch Peyflex
        for (const [net, ids] of Object.entries(PEYFLEX_NETWORKS)) {
            livePlans.peyflex[net] = [];
            for (const id of ids) {
                const res = await fetchDataPlansFromPeyflex(id);
                if (res.success && res.plans) {
                    livePlans.peyflex[net].push(...res.plans);
                }
            }
        }

        // Fetch Clubkonnect
        for (const net of CK_NETWORKS) {
            const res = await fetchDataPlansFromClubkonnect(net);
            if (res.success && res.plans) {
                livePlans.clubkonnect[net] = res.plans;
            } else {
                livePlans.clubkonnect[net] = [];
            }
        }

        const networks = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];

        for (const net of networks) {
            console.log(`Analyzing ${net}...`);
            let report = `# ${net} Full Provider Reconciliation Report\n\n`;
            
            const netDbPlans = dbPlans.filter(p => p.network.toUpperCase() === net);
            
            report += `## Overview\n`;
            report += `- Total DB Plans: ${netDbPlans.length}\n`;
            report += `- Active DB Plans: ${netDbPlans.filter(p=>p.status).length}\n`;
            report += `- Inactive DB Plans: ${netDbPlans.filter(p=>!p.status).length}\n\n`;

            const providers = ['peyflex', 'clubkonnect'];

            for (const provider of providers) {
                report += `## Provider: ${provider.toUpperCase()}\n\n`;
                
                const pDbPlans = netDbPlans.filter(p => p.provider.toLowerCase() === provider);
                const pLivePlans = livePlans[provider][net] || [];
                
                const liveMap = new Map();
                pLivePlans.forEach(p => {
                    const code = p.plan_code.toString().toLowerCase();
                    if (!liveMap.has(code)) liveMap.set(code, []);
                    liveMap.get(code).push(p);
                });

                const dbMap = new Map();
                pDbPlans.forEach(p => {
                    const id = p.api_plan_id.toString().toLowerCase();
                    if (!dbMap.has(id)) dbMap.set(id, []);
                    dbMap.get(id).push(p);
                });

                let orphaned = [];
                let priceMismatch = [];
                let duplicateDb = [];
                let missingInDb = [];
                let categoryMismatch = [];

                // Check DB plans against Live
                for (const [dbId, plansArr] of dbMap.entries()) {
                    if (plansArr.length > 1) {
                        duplicateDb.push({ id: dbId, count: plansArr.length, names: plansArr.map(p=>p.plan_name) });
                    }
                    
                    const liveArr = liveMap.get(dbId);
                    if (!liveArr) {
                        orphaned.push(plansArr[0]);
                    } else {
                        const livePlan = liveArr[0];
                        for (const dbPlan of plansArr) {
                            if (Number(dbPlan.api_price) !== Number(livePlan.price)) {
                                priceMismatch.push({ dbPlan, livePlan });
                            }
                            // Category check: e.g. Awoof, SME
                            const liveNameLower = livePlan.plan_name.toLowerCase();
                            const dbCatLower = dbPlan.category.toLowerCase();
                            if (liveNameLower.includes('awoof') && !dbCatLower.includes('awoof') && !dbCatLower.includes('gifting')) {
                                categoryMismatch.push({ dbPlan, livePlan });
                            }
                            if (liveNameLower.includes('sme') && !dbCatLower.includes('sme')) {
                                categoryMismatch.push({ dbPlan, livePlan });
                            }
                        }
                    }
                }

                // Check Live plans against DB (Missing)
                for (const [liveId, liveArr] of liveMap.entries()) {
                    if (!dbMap.has(liveId)) {
                        missingInDb.push(liveArr[0]);
                    }
                }

                report += `### 1. Orphaned Plans (In DB, Not in Live)\n`;
                if (orphaned.length === 0) report += `No orphaned plans.\n`;
                orphaned.forEach(p => report += `- [${p.status?'ACTIVE':'INACTIVE'}] ${p.plan_name} (${p.api_plan_id})\n`);
                
                report += `\n### 2. Missing Plans (In Live, Not in DB)\n`;
                if (missingInDb.length === 0) report += `No missing plans.\n`;
                missingInDb.forEach(p => report += `- ${p.plan_name} (${p.plan_code}) - ₦${p.price}\n`);

                report += `\n### 3. Price Mismatches\n`;
                if (priceMismatch.length === 0) report += `No price discrepancies.\n`;
                priceMismatch.forEach(m => report += `- ${m.dbPlan.plan_name} (${m.dbPlan.api_plan_id}) -> DB Cost: ₦${m.dbPlan.api_price} | Live Cost: ₦${m.livePlan.price}\n`);

                report += `\n### 4. Duplicate DB Entries\n`;
                if (duplicateDb.length === 0) report += `No duplicates.\n`;
                duplicateDb.forEach(d => report += `- ${d.id}: Found ${d.count} times (${d.names.join(', ')})\n`);

                report += `\n### 5. Category Mismatches\n`;
                if (categoryMismatch.length === 0) report += `No obvious category mismatches.\n`;
                categoryMismatch.forEach(m => report += `- ${m.dbPlan.plan_name} (DB Cat: ${m.dbPlan.category}) vs Live Name: ${m.livePlan.plan_name}\n`);
                
                report += `\n---\n\n`;
            }

            report += `## Recommended Fixes & Impact\n\n`;
            report += `1. **Deactivate/Delete Orphaned Plans**: If a plan is orphaned and ACTIVE, it will cause failed transactions. Action: Set \`status: false\` for these plans. Impact: Customers will no longer see them.\n`;
            report += `2. **Add Missing Plans**: New plans introduced by providers are missing. Action: Create new \`DataPlan\` entries. Impact: Increases catalog offerings.\n`;
            report += `3. **Update Prices**: Where DB cost < Live cost, profit margins are reduced or negative. Action: Update \`api_price\` and adjust \`selling_price\`. Impact: Prevents loss of revenue.\n`;
            report += `4. **Remove Duplicates**: Duplicates cause confusion in UI and querying. Action: Delete older duplicate entries. Impact: Cleaner database queries.\n`;
            report += `5. **Correct Categories**: Wrong categories mean plans appear in the wrong UI tab. Action: Update the \`category\` string. Impact: Better user experience.\n`;

            const filename = `audit_${net}.md`;
            fs.writeFileSync(path.join(ARTIFACT_DIR, filename), report, 'utf-8');
        }

        console.log('Audit generated.');
        process.exit(0);
    } catch (err) {
        console.error('Audit failed:', err);
        process.exit(1);
    }
}

runFullAudit();
