import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

dotenv.config();

const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
const secret = process.env.JWT_SECRET || 'mk_sub_data_secret_2024_premium';

async function run() {
  try {
    await mongoose.connect(connString);
    console.log("Connected to DB successfully");

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log("Admin not found!");
      return;
    }
    console.log("Admin User ID:", admin._id);
    console.log("Admin User Email:", admin.email);

    // Sign the JWT
    // From step 2 verification:
    // token = jwt.sign({ id: user._id, role: user.role, securityVerified: true }, secret, { expiresIn: '4h' });
    const token = jwt.sign(
      { id: admin._id, role: admin.role, securityVerified: true }, 
      secret, 
      { expiresIn: '24h' }
    );
    console.log("\n================ GENERATED JWT TOKEN ================");
    console.log(token);
    console.log("=====================================================\n");

    const adminUserObj = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    };
    console.log("Admin User JSON:", JSON.stringify(adminUserObj));

  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await mongoose.connection.close();
  }
}

run();
