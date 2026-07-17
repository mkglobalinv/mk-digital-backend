import mongoose from 'mongoose';
import dotenv from 'dotenv';
import util from 'util';
dotenv.config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
        const txs = await Transaction.find({ reference: { $in: ['6711511429', '6711511199'] } }).lean();
        console.log("TRANSACTIONS:");
        console.log(util.inspect(txs, { depth: null, colors: true }));
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
})();
