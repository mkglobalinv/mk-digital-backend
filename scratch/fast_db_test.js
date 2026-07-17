import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    process.stdout.write("STARTING\n");
    const uri = process.env.MONGO_URI;
    if (!uri) {
        process.stdout.write("ERROR: MONGO_URI missing\n");
        process.exit(1);
    }
    
    let client;
    try {
        process.stdout.write("CONNECTING to " + uri.substring(0, 30) + "...\n");
        client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 3000,
            connectTimeoutMS: 3000
        });
        await client.connect();
        process.stdout.write("CONNECTED SUCCESSFULLY\n");
        
        const db = client.db();
        
        // List collections
        process.stdout.write("Listing collections...\n");
        const collections = await db.listCollections().toArray();
        process.stdout.write("Collections: " + collections.map(c => c.name).join(", ") + "\n");
        
        // Fetch pricing rules
        process.stdout.write("Fetching pricing rules...\n");
        const rules = await db.collection('pricingrules').find({}).limit(50).toArray();
        process.stdout.write(`Found ${rules.length} pricing rules:\n`);
        for (const r of rules) {
            process.stdout.write(`RULE: ${r.network} | ${r.category} | isActive=${r.isActive} | retail=${r.retailPercentage} | basic=${r.basicPercentage} | vip=${r.vipPercentage}\n`);
        }
        
        // Fetch one plan from each network
        process.stdout.write("Fetching sample plans...\n");
        const networks = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];
        for (const net of networks) {
            const plan = await db.collection('dataplans').findOne({ network: net });
            process.stdout.write(`SAMPLE PLAN for ${net}: ${plan ? plan.plan_name + " (" + plan.category + ")" : "NONE"}\n`);
        }

        // Fetch counts
        const totalPlans = await db.collection('dataplans').countDocuments();
        process.stdout.write(`Total dataplans count: ${totalPlans}\n`);

        process.exit(0);
    } catch (err) {
        process.stdout.write("ERROR: " + err.message + "\n");
        if (err.stack) {
            process.stdout.write(err.stack + "\n");
        }
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

main();
