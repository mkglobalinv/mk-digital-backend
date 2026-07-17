import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const client = new MongoClient(process.env.MONGO_URI);
    try {
        await client.connect();
        const db = client.db();

        const networks = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];
        
        console.log("=== Data Plan Categories by Network ===");
        for (const net of networks) {
            const results = await db.collection('dataplans').aggregate([
                { $match: { network: net } },
                { $group: { _id: "$category", count: { $sum: 1 } } }
            ]).toArray();
            
            console.log(`\nNetwork: ${net}`);
            for (const r of results) {
                console.log(`  Category: "${r._id}" | Count: ${r.count}`);
            }
        }
        
        process.exit(0);
    } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

main();
