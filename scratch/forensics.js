import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "c:/Users/userpc/mk-digital-backend/.env" });

const runForensics = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mkdigital");
        console.log("Connected to MongoDB.");

        const PricingRule = (await import("file:///c:/Users/userpc/mk-digital-backend/models/PricingRule.js")).default;
        const DataPlan = (await import("file:///c:/Users/userpc/mk-digital-backend/models/DataPlan.js")).default;

        const rules = await PricingRule.find({}).lean();
        console.log("\n--- Existing PricingRules ---");
        console.log(JSON.stringify(rules, null, 2));

        const mtnPlans = await DataPlan.find({ network: { $regex: /^MTN$/i } }).lean();
        const mtnCategories = [...new Set(mtnPlans.map(p => p.category))];
        console.log("\n--- Existing MTN Categories ---");
        console.log(mtnCategories);

        const allPlans = await DataPlan.find({}).lean();
        console.log(`\nTotal DataPlans in DB: ${allPlans.length}`);

        const missingRules = [];
        const planCategoriesSet = new Set();
        
        for (const p of allPlans) {
            const netCat = `${p.network?.toUpperCase()} - ${p.category}`;
            planCategoriesSet.add(netCat);
        }

        console.log("\n--- Missing Rule Combinations ---");
        for (const netCat of planCategoriesSet) {
            const [network, category] = netCat.split(" - ");
            const hasRule = rules.some(r => r.network === network && r.category === category && r.isActive);
            if (!hasRule) {
                missingRules.push(netCat);
                console.log(`Missing Rule for: Network=${network}, Category=${category}`);
            }
        }

        console.log("\nForensics complete.");
        process.exit(0);
    } catch (err) {
        console.error("Forensics failed:", err);
        process.exit(1);
    }
};

runForensics();
