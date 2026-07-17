import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const fixIndexes = async () => {
    try {
        const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
        await mongoose.connect(connString);
        console.log("Connected to DB");

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        
        console.log("Fetching current indexes...");
        const indexes = await User.collection.getIndexes();
        console.log(indexes);

        if (indexes.email_1) {
            console.log("Dropping old unique email index...");
            await User.collection.dropIndex("email_1");
            console.log("Dropped email_1");
        }

        console.log("Building compound index { email: 1, referredBy: 1 }...");
        await User.collection.createIndex({ email: 1, referredBy: 1 }, { unique: true });
        console.log("Compound index built!");

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

fixIndexes();
