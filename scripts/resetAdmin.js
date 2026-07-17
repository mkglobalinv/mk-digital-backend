import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp");
    console.log("Connected to MongoDB...");

    const adminEmail = "admin@system.local";
    const temporaryPassword = "AdminTempPass123!";
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const result = await User.findOneAndUpdate(
      { email: adminEmail },
      { 
        password: hashedPassword,
        role: "admin",
        isSuspended: false,
        failedLoginAttempts: 0,
        lockoutUntil: null
      },
      { upsert: true, new: true }
    );

    console.log("Admin account reset/created successfully!");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${temporaryPassword}`);

    process.exit(0);
  } catch (error) {
    console.error("Reset Error:", error);
    process.exit(1);
  }
};

resetAdmin();
