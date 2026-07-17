import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import { fetchDataPlansFromClubkonnect } from './services/providers/clubkonnect.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    // 1. Fetch API Plans
    const apiResponse = await fetchDataPlansFromClubkonnect('MTN');
    fs.writeFileSync('ck_api_raw.json', JSON.stringify(apiResponse, null, 2));
    
    if (!apiResponse.success) {
        console.error("Failed to fetch API plans:", apiResponse.message);
        process.exit(1);
    }
    const apiPlans = apiResponse.plans;
    
    // 3. Count total
    const totalApiPlans = apiPlans.length;
    
    // 2. Fetch DB Plans
    const DataPlan = mongoose.model('DataPlan', new mongoose.Schema({}, { strict: false, collection: 'dataplans' }));
    const dbPlans = await DataPlan.find({ provider: 'clubkonnect', network: 'MTN' }).lean();
    
    // 4 & 5. Compare
    let md = `# ClubKonnect RAW API Verification Report\n\n`;
    md += `**Total MTN Plans returned by API:** ${totalApiPlans}\n\n`;
    
    const apiIds = apiPlans.map(p => p.plan_id);
    const dbIds = dbPlans.map(p => p.api_plan_id);
    
    const listA = []; // API & DB
    const listB = []; // API only
    
    apiPlans.forEach(ap => {
        const match = dbPlans.find(dp => dp.api_plan_id == ap.plan_id);
        if (match) {
            listA.push({ api: ap, db: match });
        } else {
            listB.push(ap);
        }
    });
    
    // List C: in screenshot but not in API.
    // Screenshot IDs known missing from DB and to be checked in API:
    // 110MB Daily, 230MB Daily, 500MB Daily, 1GB Daily, 3.2GB 2-Day, 500MB Weekly, 6GB Weekly, 20GB Weekly, 2GB+2mins Monthly, 2.7GB+2mins Monthly
    const knownScreenshotNames = [
        "110MB Daily Plan - 1 day (Awoof Data)",
        "230MB Daily Plan - 1 day (Awoof Data)",
        "500MB Daily Plan - 1 day (Awoof Data)",
        "1GB Daily Plan + 1.5mins - 1 day (Awoof Data)",
        "3.2GB 2-Day Plan - 2 days (Awoof Data)",
        "500MB Weekly Plan - 7 days (Direct Data)",
        "6GB Weekly Plan - 7 days (Direct Data)",
        "20GB Weekly Plan - 7 days (Direct Data)",
        "2GB+2mins Monthly Plan - 30 days (Direct Data)",
        "2.7GB+2mins Monthly Plan - 30 days (Direct Data)"
    ];
    
    const listC = knownScreenshotNames.filter(name => !apiPlans.some(ap => ap.name === name));
    
    md += `## A. Returned by API and stored in database ✅\n`;
    md += `| Plan Name | Plan ID | Price |\n`;
    md += `|---|---|---|\n`;
    listA.forEach(item => {
        md += `| ${item.api.name} | ${item.api.plan_id} | ${item.api.price} |\n`;
    });
    
    md += `\n## B. Returned by API but missing from database ❌\n`;
    md += `| Plan Name | Plan ID | Price |\n`;
    md += `|---|---|---|\n`;
    if (listB.length === 0) md += `| (None) | | |\n`;
    listB.forEach(item => {
        md += `| ${item.name} | ${item.plan_id} | ${item.price} |\n`;
    });
    
    md += `\n## C. Present in screenshots but not returned by API ⚠️\n`;
    md += `| Plan Name |\n`;
    md += `|---|\n`;
    if (listC.length === 0) md += `| (None) |\n`;
    listC.forEach(name => {
        md += `| ${name} |\n`;
    });
    
    fs.writeFileSync('ck_api_audit_report.md', md);
    console.log("Report generated at ck_api_audit_report.md");
    process.exit(0);
});
