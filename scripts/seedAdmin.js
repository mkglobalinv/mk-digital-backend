import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp");
    console.log("Connected to MongoDB for seeding...");

    const adminEmail = "admin@system.local";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      process.exit(0);
    }

    const temporaryPassword = "AdminTempPass123!"; // Should be changed immediately
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const admin = new User({
      name: "System Administrator",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      forcePasswordChange: true
    });

    await admin.save();
    console.log("Admin account seeded successfully!");
    console.log(`Email: ${adminEmail}`);
    console.log(`Temp Password: ${temporaryPassword}`);
    console.log("IMPORTANT: Please change this password on first login.");

    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedAdmin();
