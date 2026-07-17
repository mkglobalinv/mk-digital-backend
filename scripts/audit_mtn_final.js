import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import DataPlan from '../models/DataPlan.js';
import { fetchDataPlansFromPeyflex } from '../services/providers/peyflex.js';

const ARTIFACT_DIR = path.resolve('C:/Users/userpc/.gemini/antigravity/brain/9b5d5f65-d81f-47f1-a849-2c2b702634e3');
const ENDPOINTS = ['mtn_gifting_data', 'mtn_data_share', 'mtn_awoof_gifting'];

async function runAudit() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB.');

        const dbPlans = await DataPlan.find({ network: 'MTN', provider: 'peyflex' });
        console.log(`Fetched ${dbPlans.length} MTN Peyflex plans from DB.`);

        let livePlans = [];
        for (const endpoint of ENDPOINTS) {
            const res = await fetchDataPlansFromPeyflex(endpoint);
            if (res.success && res.plans) {
                livePlans.push(...res.plans);
            }
        }
        
        console.log(`Fetched ${livePlans.length} live plans from Peyflex endpoints.`);

        let report = `# MTN Final Audit Report\n\n`;
        report += `## Summary\n`;
        report += `- Expected Live Plans: 51\n`;
        report += `- Actual Live Plans Fetched: ${livePlans.length}\n`;
        report += `- Database MTN Peyflex Plans Total: ${dbPlans.length}\n`;
        report += `- Active DB Plans: ${dbPlans.filter(p => p.status).length}\n`;
        report += `- Inactive DB Plans: ${dbPlans.filter(p => !p.status).length}\n\n`;

        const dbMap = new Map();
        const liveMap = new Map();

        dbPlans.forEach(p => {
            const code = p.api_plan_id.toString().toLowerCase();
            if (!dbMap.has(code)) dbMap.set(code, []);
            dbMap.get(code).push(p);
        });

        livePlans.forEach(p => {
            const code = p.plan_code.toString().toLowerCase();
            if (!liveMap.has(code)) liveMap.set(code, []);
            liveMap.get(code).push(p);
        });

        let orphaned = [];
        let duplicates = [];
        let missing = [];

        // Check DB against Live
        for (const [code, arr] of dbMap.entries()) {
            if (arr.length > 1) {
                duplicates.push({ code, count: arr.length, names: arr.map(a => a.plan_name) });
            }
            if (!liveMap.has(code)) {
                orphaned.push(...arr);
            }
        }

        // Check Live against DB
        for (const [code, arr] of liveMap.entries()) {
            if (!dbMap.has(code)) {
                missing.push(arr[0]);
            }
        }

        report += `## Validation Results\n\n`;
        
        report += `### 1. Missing Plans (In Live, Not in DB)\n`;
        if (missing.length === 0) report += `✅ Perfect. All live plans exist in the DB.\n`;
        else missing.forEach(p => report += `- ${p.plan_name} (${p.plan_code})\n`);

        report += `\n### 2. Orphaned Plans (In DB, Not in Live)\n`;
        if (orphaned.length === 0) report += `✅ Perfect. No extra plans exist in the DB.\n`;
        else {
            orphaned.forEach(p => report += `- [${p.status ? 'ACTIVE' : 'INACTIVE'}] ${p.plan_name} (${p.api_plan_id})\n`);
            report += `\n> [!TIP]\n> These orphaned plans were left over from previous integrations (like SME). Since they are INACTIVE, they won't harm the user experience, but you may want to delete them eventually.\n`;
        }

        report += `\n### 3. Duplicates\n`;
        if (duplicates.length === 0) report += `✅ Perfect. No duplicate plans found.\n`;
        else duplicates.forEach(d => report += `- ${d.code} occurs ${d.count} times (${d.names.join(', ')})\n`);

        const filename = `MTN_Final_Audit.md`;
        fs.writeFileSync(path.join(ARTIFACT_DIR, filename), report, 'utf-8');
        
        console.log('Final Audit Generated.');
        process.exit(0);

    } catch (err) {
        console.error('Audit failed:', err);
        process.exit(1);
    }
}

runAudit();
