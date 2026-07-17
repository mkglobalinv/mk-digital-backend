import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const cleanUsers = async () => {
    try {
        const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
        await mongoose.connect(connString);
        console.log("Connected to DB");

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        
        console.log("Checking for users with empty email...");
        const emptyUsers = await User.find({ email: "" });
        console.log(`Found ${emptyUsers.length} users with empty email.`);

        if (emptyUsers.length > 0) {
            console.log("Deleting users with empty email...");
            const result = await User.deleteMany({ email: "" });
            console.log(`Deleted ${result.deletedCount} users.`);
        }

        // Try to build the index again
        console.log("Dropping old email_1 index...");
        try { await User.collection.dropIndex("email_1"); } catch(e) {}
        
        console.log("Building compound index { email: 1, referredBy: 1 }...");
        await User.collection.createIndex({ email: 1, referredBy: 1 }, { unique: true });
        console.log("Compound index built successfully! ✅");

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

cleanUsers();
