import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const check = async () => {
    try {
        const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
        await mongoose.connect(connString);
        
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        
        console.log("Empty String referredBy Check:");
        const users = await User.find({ referredBy: "" });
        console.log(`Found ${users.length} users with empty string referredBy.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
