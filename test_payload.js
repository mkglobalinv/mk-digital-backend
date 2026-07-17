import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb+srv://dillionnduka:V5Y7r3X5lH1W2P5U@mk-sub-db-cluster.hj9idyn.mongodb.net/mksub_db?retryWrites=true&w=majority';

mongoose.connect(uri)
  .then(async () => {
    // We will just find one of each
    const retail = await User.findOne({ role: 'user', referredBy: null });
    const reseller = await User.findOne({ role: 'reseller_admin' });
    const customer = await User.findOne({ role: 'user', referredBy: { $ne: null } });
    
    const filterUser = (u) => {
        if(!u) return null;
        return {
            _id: u._id,
            email: u.email,
            role: u.role,
            accountType: u.accountType,
            userType: u.userType,
            apiLevel: u.apiLevel,
            referredBy: u.referredBy,
            parentReseller: u.parentReseller,
            isReseller: u.isReseller
        };
    };

    console.log('--- RETAIL USER PAYLOAD ---');
    console.log(JSON.stringify(filterUser(retail), null, 2));
    
    console.log('\n--- RESELLER PAYLOAD ---');
    console.log(JSON.stringify(filterUser(reseller), null, 2));
    
    console.log('\n--- RESELLER CUSTOMER PAYLOAD ---');
    console.log(JSON.stringify(filterUser(customer), null, 2));
    
    mongoose.disconnect();
  });
