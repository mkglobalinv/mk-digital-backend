import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DataPlan from './models/DataPlan.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const eduPlans = await DataPlan.find({ category: /education/i });
        console.log("Education plans in DB:");
        console.log(eduPlans);
        
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
