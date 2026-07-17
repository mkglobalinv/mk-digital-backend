import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const DataPlanSchema = new mongoose.Schema({}, { strict: false });
const DataPlan = mongoose.model('DataPlan', DataPlanSchema, 'dataplans'); // assuming 'dataplans' is the collection

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const plans = await DataPlan.find({ network: /MTN/i, plan_name: /110MB/i });
        console.log(JSON.stringify(plans, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
