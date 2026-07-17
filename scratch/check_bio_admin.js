import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import User from "../models/User.js";

async function checkBiometric() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: "admin@system.local" });
    console.log("User:", user?.email);
    console.log("Biometric Enabled:", user?.biometricEnabled);
    console.log("Credentials Count:", user?.webauthnCredentials?.length);
    process.exit();
}

checkBiometric();
