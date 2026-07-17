import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import ResellerRequest from '../models/ResellerRequest.js';
import AdminLog from '../models/AdminLog.js';

dotenv.config();

const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";

async function run() {
  try {
    console.log("Connecting to:", connString);
    await mongoose.connect(connString);
    console.log("Connected to DB successfully");

    const request = await ResellerRequest.findOne({ status: 'pending' });
    if (!request) {
      console.log("No pending requests found.");
      return;
    }
    console.log("Found request:", request._id);

    const user = await User.findById(request.userId);
    if (!user) {
      console.log("User not found!");
      return;
    }
    console.log("Found user:", user.email);

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log("Admin not found!");
      return;
    }
    console.log("Found admin:", admin.email);

    console.log("Modifying user fields...");
    user.role = 'reseller_admin';
    user.whiteLabelStatus = 'active';
    user.resellerActivationStatus = 'active';
    user.isResellerActivated = false;
    user.trialStartDate = new Date();
    user.trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.resellerTier = 'basic';
    console.log("Modified basic fields.");

    user.features = {
        custom_domain: false,
        apk_generation: false,
        pwa_enabled: true,
        push_notifications: false,
        premium_analytics: false,
        ai_tools: false,
        playstore_publish: false,
        ios_app: false,
        premium_branding: false,
        dedicated_support: false
    };
    console.log("Modified features.");

    if (request.domainOption === 'subdomain') {
        user.subdomain = request.requestedDomain;
    } else if (request.domainOption === 'own_domain') {
        user.customDomain = request.requestedDomain;
        user.features.custom_domain = true; 
    }
    console.log("Modified domain fields.");
    
    user.branding = {
        siteName: request.brandName,
        whatsappNumber: request.whatsapp,
        contactEmail: request.supportEmail,
        primaryColor: request.primaryColor,
        secondaryColor: request.secondaryColor
    };
    console.log("Modified branding fields.");

    console.log("Saving user...");
    const savedUser = await user.save();
    console.log("User saved successfully!", savedUser ? "YES" : "NO");

    request.status = 'approved';
    console.log("Saving request...");
    const savedRequest = await request.save();
    console.log("Request saved successfully!", savedRequest ? "YES" : "NO");

    console.log("Creating AdminLog...");
    const log = await AdminLog.create({ 
        adminId: admin._id, 
        action: 'APPROVE_RESELLER_REQUEST', 
        details: { requestId: request._id, userId: user._id, brandName: request.brandName } 
    });
    console.log("AdminLog created successfully!", log ? "YES" : "NO");

    console.log("Simulated approval completed successfully!");
  } catch (err) {
    console.error("ERROR CAUGHT DURING RUN:", err.message);
    console.error(err.stack);
  } finally {
    console.log("Closing connection...");
    await mongoose.connection.close();
    console.log("Connection closed.");
  }
}

run();
