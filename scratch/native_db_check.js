import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    try {
        console.log("Connecting natively to database...");
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        console.log("Connected.");
        const db = mongoose.connection.db;

        console.log("\n--- Querying Pricing Rules ---");
        const rules = await db.collection('pricingrules').find({}).toArray();
        console.log(`Found ${rules.length} pricing rules:`);
        for (const r of rules) {
            console.log(`Rule: ID=${r._id}, Network=${r.network}, Category=${r.category}, IsActive=${r.isActive}`);
        }

        console.log("\n--- Querying Data Plan Network Counts ---");
        const planCounts = await db.collection('dataplans').aggregate([
            { $group: { _id: { network: "$network", category: "$category", status: "$status" }, count: { $sum: 1 } } }
        ]).toArray();
        for (const pc of planCounts) {
            console.log(`Plans: Network=${pc._id.network}, Category=${pc._id.category}, Status=${pc._id.status} => Count=${pc.count}`);
        }

        console.log("\n--- Querying Active Providers ---");
        const providers = await db.collection('providerstatuses').find({}).toArray();
        for (const p of providers) {
            console.log(`Provider: ${p.providerName} | Available=${p.isAvailable} | API=${p.apiStatus} | Maintenance=${p.isUnderMaintenance}`);
        }

        process.exit(0);
    } catch (err) {
        console.error("Database Error:", err.message);
        process.exit(1);
    }
}

main();
