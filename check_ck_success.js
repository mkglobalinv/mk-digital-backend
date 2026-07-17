import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkCKSuccess() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Transaction = mongoose.model('Transaction', new mongoose.Schema({
            status: String,
            provider_used: String,
            createdAt: Date
        }));

        const today = new Date();
        today.setHours(0,0,0,0);

        const successes = await Transaction.find({ 
            createdAt: { $gte: today },
            status: 'success',
            provider_used: { $regex: /clubkonnect|value/i }
        });

        console.log(`Found ${successes.length} successful Clubkonnect transactions today.`);
        process.exit(0);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

checkCKSuccess();
