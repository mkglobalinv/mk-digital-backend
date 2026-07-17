import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ResellerRequest from '../models/ResellerRequest.js';

dotenv.config();
const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";

async function run() {
  try {
    console.log("Connecting...");
    await mongoose.connect(connString);
    console.log("Connected.");
    
    const request = await ResellerRequest.findOne({ status: 'pending' });
    if (!request) {
      console.log("No pending requests.");
      return;
    }
    console.log("Found request:", request._id);
    
    request.status = 'rejected';
    console.log("Saving request...");
    const res = await request.save();
    console.log("Saved successfully! Result ID:", res._id, "Status:", res.status);
    
    // Restore status to pending
    request.status = 'pending';
    console.log("Restoring request...");
    await request.save();
    console.log("Restored successfully!");
  } catch (err) {
    console.error("ERROR CAUGHT:", err.message);
    console.error(err.stack);
  } finally {
    await mongoose.connection.close();
    console.log("Disconnected.");
    process.exit(0);
  }
}
run();
