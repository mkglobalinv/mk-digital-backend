import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const DataPlanSchema = new mongoose.Schema({}, { strict: false });
const DataPlan = mongoose.model('DataPlan', DataPlanSchema, 'dataplans');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const plans = await DataPlan.find({ 
            $or: [
                { category: /Awoof/i },
                { plan_name: /Awoof/i }
            ]
        });
        console.log("Found Awoof Plans:", JSON.stringify(plans, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
