import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "c:/Users/userpc/mk-digital-backend/.env" });

const runForensics = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mkdigital");
        console.log("Connected to MongoDB.");

        const DataPlan = (await import("file:///c:/Users/userpc/mk-digital-backend/models/DataPlan.js")).default;
        
        const allPlans = await DataPlan.find({}).lean();
        const providers = [...new Set(allPlans.map(p => p.provider))];
        console.log("Providers in DB:");
        console.log(providers);

        const mtnSmePlans = await DataPlan.find({ network: 'MTN', category: 'SME' }).lean();
        const mtnSmeProviders = [...new Set(mtnSmePlans.map(p => p.provider))];
        console.log("Providers for MTN SME in DB:");
        console.log(mtnSmeProviders);

        process.exit(0);
    } catch (err) {
        console.error("Forensics failed:", err);
        process.exit(1);
    }
};

runForensics();
