import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
    const DataPlan = mongoose.model('DataPlan', new mongoose.Schema({}, { strict: false, collection: 'dataplans' }));
    
    const count = await DataPlan.countDocuments({ network: 'MTN', provider: 'clubkonnect' });
    console.log(`Total ClubKonnect MTN plans in database: ${count}`);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
