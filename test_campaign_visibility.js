import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const testAccounts = async () => {
    const secret = process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium";
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://dillionnduka:V5Y7r3X5lH1W2P5U@mk-sub-db-cluster.hj9idyn.mongodb.net/mksub_db?retryWrites=true&w=majority');
    
    const retailUser = await User.findOne({ role: 'user', referredBy: null });
    const resellerAdmin = await User.findOne({ role: 'reseller_admin' });
    const resellerCustomer = await User.findOne({ role: 'user', referredBy: { $ne: null } });
    
    console.log("=== Found Test Accounts ===");
    console.log("Retail User ID:", retailUser?._id);
    console.log("Reseller Admin ID:", resellerAdmin?._id);
    console.log("Reseller Customer ID:", resellerCustomer?._id);
    
    const generateToken = (user) => jwt.sign({ id: user._id, role: user.role }, secret);
    
    const fetchCampaigns = async (roleName, user) => {
        if (!user) {
            console.log(`Skipping ${roleName} - no account found.`);
            return;
        }
        const token = generateToken(user);
        try {
            const res = await axios.get('http://localhost:8800/api/marketing/campaigns/active', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`\n--- ${roleName} Campaigns ---`);
            res.data.forEach(c => {
                console.log(`- Type: ${c.campaignType} | Target: ${c.targetAudience} | Title: ${c.title}`);
            });
        } catch (e) {
            console.log(`Error fetching for ${roleName}:`, e.message);
        }
    };
    
    await fetchCampaigns("Retail User", retailUser);
    await fetchCampaigns("Reseller Admin", resellerAdmin);
    await fetchCampaigns("Reseller Customer", resellerCustomer);
    
    process.exit();
};

testAccounts();
