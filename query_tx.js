import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp");
        
        // Find by reference or within api_response
        const db = mongoose.connection.db;
        const txs = await db.collection('transactions').find({
            $or: [
                { reference: { $regex: "202606031106" } },
                { "api_response.provider_response.order_id": { $regex: "202606031106" } },
                { "api_response.provider_response.id": { $regex: "202606031106" } },
                { "api_response.provider_response.reference": { $regex: "202606031106" } },
                { "api_response.provider_response": { $regex: "202606031106" } }
            ]
        }).toArray();
        
        if (txs.length > 0) {
            console.log("Found Transaction:");
            console.log(JSON.stringify(txs[0], null, 2));
        } else {
            console.log("Transaction not found in local DB.");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
