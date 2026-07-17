import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const migrateAccounts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp");
        console.log("Connected to MongoDB");

        // 1. Update users WITH an account_number to 'permanent'
        const permResult = await User.updateMany(
            { account_number: { $exists: true, $ne: "" }, accountType: { $ne: "permanent" } },
            { $set: { accountType: "permanent" } }
        );
        console.log(`Updated ${permResult.modifiedCount} users with existing virtual accounts to 'permanent'.`);

        // 2. Update users WITHOUT an account_number to 'none'
        const noneResult = await User.updateMany(
            { $or: [{ account_number: { $exists: false } }, { account_number: "" }], accountType: { $ne: "none" } },
            { $set: { accountType: "none" } }
        );
        console.log(`Updated ${noneResult.modifiedCount} users without virtual accounts to 'none'.`);

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
};

migrateAccounts();
