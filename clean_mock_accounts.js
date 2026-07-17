import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const cleanMockAccounts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp");
        console.log("Connected to MongoDB");

        // Find users with "Mock Bank" or account number "0067100155"
        const result = await User.updateMany(
            { 
                $or: [
                    { bank_name: /mock/i },
                    { account_number: "0067100155" }
                ] 
            },
            { 
                $unset: { account_number: "", bank_name: "", account_name: "" },
                $set: { accountType: "none" }
            }
        );
        
        console.log(`Cleaned ${result.modifiedCount} users who had mock accounts. They will now see the new Funding Center.`);

        console.log("Cleanup completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Cleanup error:", err);
        process.exit(1);
    }
};

cleanMockAccounts();
