import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const checkUsers = async () => {
    try {
        const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
        await mongoose.connect(connString);
        
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        
        console.log("Existing Users Sample:");
        const users = await User.find({}).limit(5);
        users.forEach(u => {
            console.log(`Email: ${u.email}, referredBy: ${u.referredBy}, type: ${typeof u.referredBy}`);
        });

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

checkUsers();
