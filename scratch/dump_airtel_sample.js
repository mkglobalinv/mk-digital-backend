import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const client = new MongoClient(process.env.MONGO_URI);
    try {
        await client.connect();
        const db = client.db();

        // 1. Fetch one sample Airtel plan
        const airtelPlan = await db.collection('dataplans').findOne({ network: 'AIRTEL' });
        console.log("=== Airtel Plan Sample ===");
        console.log(JSON.stringify(airtelPlan, null, 2));

        // 2. Fetch one sample Glo plan
        const gloPlan = await db.collection('dataplans').findOne({ network: 'GLO' });
        console.log("\n=== Glo Plan Sample ===");
        console.log(JSON.stringify(gloPlan, null, 2));

        // 3. Fetch one sample 9mobile plan
        const nineMobilePlan = await db.collection('dataplans').findOne({ network: '9MOBILE' });
        console.log("\n=== 9mobile Plan Sample ===");
        console.log(JSON.stringify(nineMobilePlan, null, 2));

        // 4. Query all pricing rules in the database
        const rules = await db.collection('pricingrules').find({}).toArray();
        console.log("\n=== All Pricing Rules in Database ===");
        console.log(JSON.stringify(rules, null, 2));

        process.exit(0);
    } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

main();
