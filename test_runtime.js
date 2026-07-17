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
    
    const generateToken = (user) => jwt.sign({ id: user._id, role: user.role }, secret);
    
    const testFrontendLogic = async (roleName, user) => {
        if (!user) return;
        const token = generateToken(user);
        
        try {
            // 1. Backend Verification
            const res = await axios.get('http://127.0.0.1:8800/api/marketing/campaigns/active', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log(`\n========================================`);
            console.log(`TESTING: ${roleName}`);
            console.log(`========================================`);
            console.log(`[NETWORK RESPONSE] Returned ${res.data.length} campaigns from backend API.`);
            
            // 2. Frontend Render Logic Simulation (Exact code from CampaignGrid.jsx)
            console.log(`\n[FRONTEND RENDER LOGIC DECISIONS]`);
            const gridCampaigns = res.data.filter(c => {
                const logDecision = (result) => {
                    console.log(`Campaign Type: ${c.campaignType}\nDisplay Mode: ${c.displayMode}\nUser Role: ${user ? user.role : 'none'}\nReferredBy: ${user && user.referredBy ? 'YES' : 'null'}\nResult: ${result}\n`);
                    return result === 'ALLOWED';
                };

                if (c.campaignType !== 'Announcement') {
                    if (!user) return logDecision('BLOCKED');
                    if (user.role !== 'retail' && user.role !== 'user') return logDecision('BLOCKED');
                    if (user.role === 'user' && user.referredBy) return logDecision('BLOCKED');
                }
                
                // Allow all display modes for this test just to verify audience filtering
                return logDecision('ALLOWED');
            });
            
            console.log(`[FINAL RENDER RESULT] ${roleName} sees ${gridCampaigns.length} campaigns on screen.`);
            gridCampaigns.forEach(c => {
                 console.log(` -> Visible: [${c.campaignType}] ${c.title}`);
            });
            
        } catch (e) {
            console.log(`Error testing ${roleName}:`, e.stack || e);
        }
    };
    
    await testFrontendLogic("Retail User", retailUser);
    await testFrontendLogic("Reseller", resellerAdmin);
    await testFrontendLogic("Reseller Customer", resellerCustomer);
    
    process.exit();
};

testAccounts();
