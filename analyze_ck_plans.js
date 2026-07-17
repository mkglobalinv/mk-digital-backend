import fs from 'fs';

const data = JSON.parse(fs.readFileSync('ck_plans.json', 'utf16le'));

const mtnPlans = data.filter(p => p.network === 'MTN').sort((a, b) => a.api_price - b.api_price);

console.log(`| Database Plan | Database Plan ID | Category | Provider Name | Price |`);
console.log(`|---------------|------------------|----------|---------------|-------|`);
mtnPlans.forEach(p => {
    console.log(`| ${p.plan_name} | ${p.api_plan_id} | ${p.category} | ${p.provider} | ${p.api_price} |`);
});
