
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Session from "./models/Session.js";

const test = async () => {
    try {
        const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
        console.log("Connecting to:", connString);
        await mongoose.connect(connString);
        console.log("Connected ✅");

        const user = await User.findOne({});
        if (user) {
            console.log("Found user:", user.email);
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium");
            console.log("JWT Signed ✅");
            
            // Try to create a session
            // We use a unique token to avoid unique constraint error
            const testToken = "test_token_" + Date.now();
            await Session.create({ userId: user._id, token: testToken, deviceInfo: "Diagnostic Script" });
            console.log("Session Created ✅");
            
            // Cleanup
            await Session.deleteOne({ token: testToken });
            console.log("Session Cleanup ✅");
        } else {
            console.log("No users found in DB.");
        }
    } catch (err) {
        console.error("Test Failed ❌:", err);
    } finally {
        await mongoose.disconnect();
    }
};

test();
