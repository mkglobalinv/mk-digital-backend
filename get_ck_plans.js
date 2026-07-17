import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const DataPlan = mongoose.model('DataPlan', new mongoose.Schema({}, { strict: false, collection: 'dataplans' }));
    const plans = await DataPlan.find({ provider: 'clubkonnect', network: 'MTN' }).lean();
    plans.sort((a, b) => a.api_price - b.api_price);
    
    let md = `| Database Plan | Database Plan ID | Category | Provider Name | Price |\n`;
    md += `|---------------|------------------|----------|---------------|-------|\n`;
    plans.forEach(p => {
        md += `| ${p.plan_name} | ${p.api_plan_id} | ${p.category} | ${p.provider} | ${p.api_price} |\n`;
    });
    fs.writeFileSync('mtn_ck_audit.md', md);
    console.log("Audit table written to mtn_ck_audit.md");
    process.exit(0);
});
