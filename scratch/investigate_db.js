import mongoose from 'mongoose';
import DataPlan from '../models/DataPlan.js';

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/vtuapp');
        console.log("Connected to MongoDB.");

        const plans = await DataPlan.find({}, 'network plan_name api_plan_id status provider selling_price').lean();
        
        const map = new Map();
        let duplicates = 0;

        for (const p of plans) {
            const key = `${p.network}_${p.api_plan_id}`;
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key).push(p);
        }

        for (const [key, list] of map.entries()) {
            if (list.length > 1) {
                console.log(`\nDuplicate found for ${key}:`);
                console.log(list);
                duplicates++;
            }
        }

        console.log(`\nTotal duplicate pairs: ${duplicates}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
