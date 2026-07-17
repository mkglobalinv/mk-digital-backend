import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            resellerTier: String,
            customPrices: { type: Map, of: Number },
            assignedPrices: { type: Map, of: Number }
        }, { strict: false }));
        const reseller = await User.findById('6a12c70cf6f5c5b02744800c');
        console.log("Custom Prices:", reseller.customPrices);
        console.log("Assigned Prices:", reseller.assignedPrices);
        
        const key = 'MTN_100_dot_01'; // 'MTN_100.01'
        console.log('has key?', reseller.customPrices ? reseller.customPrices.has(key) : false);
        console.log('get key:', reseller.customPrices ? reseller.customPrices.get(key) : undefined);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
})();
