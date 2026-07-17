import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DataPlan from './models/DataPlan.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB.");

    try {
        // Drop old unique index
        await DataPlan.collection.dropIndex("api_plan_id_1_provider_1");
        console.log("Successfully dropped old index: api_plan_id_1_provider_1");
    } catch (e) {
        console.log("Index api_plan_id_1_provider_1 might not exist or already dropped:", e.message);
    }

    try {
        // Mongoose should auto-create the new index upon starting the app, but we can manually build it here just in case
        await DataPlan.syncIndexes();
        console.log("Indexes synchronized successfully.");
    } catch (e) {
        console.error("Failed to sync indexes:", e);
    }

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
