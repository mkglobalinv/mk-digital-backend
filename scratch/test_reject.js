import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import ResellerRequest from '../models/ResellerRequest.js';
import AdminLog from '../models/AdminLog.js';

dotenv.config();

const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";

async function run() {
  try {
    await mongoose.connect(connString);
    console.log("Connected to DB successfully");

    const request = await ResellerRequest.findOne({ status: 'pending' });
    if (!request) {
      console.log("No pending requests found.");
      return;
    }
    console.log("Found request:", request._id);

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log("Admin not found!");
      return;
    }

    console.log("Attempting rejection simulation...");
    // Save current status to restore it later
    const originalStatus = request.status;
    
    request.status = 'rejected';
    request.adminNotes = 'Simulated reject notes';
    await request.save();
    console.log("Request status updated to rejected!");

    const log = await AdminLog.create({ 
        adminId: admin._id, 
        action: 'REJECT_RESELLER_REQUEST', 
        details: { requestId: request._id, brandName: request.brandName, reason: 'Simulated reject' } 
    });
    console.log("AdminLog created successfully!", log ? "YES" : "NO");

    // Restore request status
    request.status = originalStatus;
    request.adminNotes = undefined;
    await request.save();
    console.log("Restored request status to pending successfully!");

    console.log("Simulated rejection completed successfully without errors!");
  } catch (err) {
    console.error("ERROR DURING REJECTION SIMULATION:", err.message);
    console.error(err.stack);
  } finally {
    await mongoose.connection.close();
  }
}

run();
