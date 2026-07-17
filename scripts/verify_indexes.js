import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const verify = async () => {
    try {
        const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
        await mongoose.connect(connString);
        
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const indexes = await User.collection.getIndexes();
        
        console.log("CURRENT INDEXES:");
        console.log(JSON.stringify(indexes, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
