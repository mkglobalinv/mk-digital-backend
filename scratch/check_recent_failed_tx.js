import mongoose from 'mongoose';
import util from 'util';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
        const recentFailures = await Transaction.find({ status: 'failed', resellerId: { $ne: null }, isApiRequest: true })
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();
        console.log("RECENT FAILED CUSTOMER TRANSACTIONS:");
        console.log(util.inspect(recentFailures, { depth: null, colors: true }));
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
})();
