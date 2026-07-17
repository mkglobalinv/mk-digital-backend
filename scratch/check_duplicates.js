import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import ResellerRequest from '../models/ResellerRequest.js';

dotenv.config();

const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";

async function run() {
  try {
    await mongoose.connect(connString);
    console.log("Connected to DB successfully");

    console.log("\n=== USERS WITH SUBDOMAINS OR CUSTOM DOMAINS ===");
    const users = await User.find({ 
      $or: [
        { subdomain: { $ne: null } },
        { customDomain: { $ne: null } }
      ]
    }, 'name email role subdomain customDomain whiteLabelStatus');
    users.forEach(u => {
      console.log(`User: ${u.email} | Name: ${u.name} | Role: ${u.role} | Subdomain: ${u.subdomain} | CustomDomain: ${u.customDomain} | WLStatus: ${u.whiteLabelStatus}`);
    });

    console.log("\n=== PENDING RESELLER REQUESTS ===");
    const reqs = await ResellerRequest.find({ status: 'pending' }).populate('userId', 'email name');
    reqs.forEach(r => {
      console.log(`RequestID: ${r._id} | User: ${r.userId?.email} | Brand: ${r.brandName} | DomainOption: ${r.domainOption} | RequestedDomain: ${r.requestedDomain} | Status: ${r.status}`);
    });

    console.log("\n=== APPROVED OR REJECTED RESELLER REQUESTS ===");
    const otherReqs = await ResellerRequest.find({ status: { $ne: 'pending' } }).populate('userId', 'email name');
    otherReqs.forEach(r => {
      console.log(`RequestID: ${r._id} | User: ${r.userId?.email} | Brand: ${r.brandName} | DomainOption: ${r.domainOption} | RequestedDomain: ${r.requestedDomain} | Status: ${r.status}`);
    });

  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await mongoose.connection.close();
  }
}

run();
