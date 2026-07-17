import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User.js';

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtuapp').then(async () => {
  const users = await User.find({ 'branding.siteName': { $in: ['refferdata', 'recdata', 'findata', 'Datasub', 'usal data'] } });
  
  for (const u of users) {
    console.log(JSON.stringify({
      ownerUserId: u._id.toString(),
      email: u.email,
      websiteName: u.branding?.siteName,
      role: u.role,
      websiteOwnerStatus: u.resellerActivationStatus || 'none',
      subscriptionTier: u.resellerTier || 'basic',
      subscriptionStatus: u.isResellerActivated ? 'Active' : 'Inactive',
      adminPortalAccess: u.admin_subdomain ? 'Enabled' : 'Disabled',
      websiteStatus: u.whiteLabelStatus || 'pending'
    }, null, 2));
  }
  process.exit();
});
