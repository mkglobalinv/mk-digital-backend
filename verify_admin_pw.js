
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "./models/User.js";
import bcrypt from "bcrypt";

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = "mksubdata@gmail.com";
        const password = "Admin@123";
        
        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found");
            return;
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match result:", isMatch);
        console.log("Hashed password in DB:", user.password);
        
        const testHash = await bcrypt.hash(password, 10);
        const testMatch = await bcrypt.compare(password, testHash);
        console.log("New hash match result:", testMatch);
        
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
};

test();
