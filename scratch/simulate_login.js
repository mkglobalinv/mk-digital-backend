import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User.js';

const simulateLogin = async (emailToTest, resellerIdContext = null, sessionType = 'retail', contextName = 'Main Platform') => {
    console.log(`\n==================================================`);
    console.log(`SIMULATING LOGIN FOR: ${emailToTest}`);
    console.log(`Portal Context: ${contextName}`);
    console.log(`Requested Session Type: ${sessionType}`);
    
    // 1. User records found in DB before merge
    const allUsers = await User.find({ email: emailToTest });
    
    // 2. Mocking post-merge logic:
    const getScore = (u) => {
        if (u.role === 'superadmin') return 100;
        if (u.role === 'admin') return 90;
        if (u.role === 'reseller_admin' && u.resellerActivationStatus === 'active') return 80;
        if (u.role === 'reseller_admin') return 70;
        if (u.whiteLabelStatus === 'active') return 60;
        return 10;
    };
    let primary = allUsers[0];
    for (const u of allUsers) {
        if (getScore(u) > getScore(primary)) primary = u;
    }

    const postMergeQuery = { 
        email: emailToTest, 
        _id: primary._id, // $ne: archived equivalent
        $or: [
            { referredBy: resellerIdContext === null ? { $in: [null, undefined] } : resellerIdContext },
            { _id: resellerIdContext },
            { role: 'admin' }
        ]
    };
    
    let user = await User.findOne(postMergeQuery);
    
    if (!user) {
        console.log(`\n[Result]: LOGIN FAILED (Blocked by AuthController Tenant Isolation Rules)`);
        return;
    }

    console.log(`\n[User Returned by Login]:`);
    console.log(` - User ID: ${user._id}`);
    console.log(` - Role returned: ${user.role}`);
    
    // AuthController logic
    const isBusinessAccount = (u) => {
        return u && (
            u.role === 'reseller_admin' ||
            u.resellerActivationStatus === 'active' ||
            u.whiteLabelStatus === 'active' ||
            u.apiLevel === 'reseller'
        );
    };

    const isOwner = resellerIdContext && user._id.toString() === resellerIdContext.toString();
    const isGlobalReseller = !resellerIdContext && isBusinessAccount(user);
    const isBiz = resellerIdContext ? false : (isOwner || isGlobalReseller);

    let portalRoutingResult = "Success (Proceed to Dashboard)";

    // Phase 11 Admin Subdomain patch (which our migration script will fix)
    const activeAdminSubdomain = user.admin_subdomain || user.subdomain;

    if (sessionType === 'retail') {
        if (user.role === 'admin' || user.role === 'superadmin') {
            portalRoutingResult = "BLOCKED: Admin accounts must use the Admin Portal.";
        } else if (isBiz) {
            if (user.independence_redirect_enabled && activeAdminSubdomain) {
                 portalRoutingResult = `REDIRECTED: targetUrl -> https://${activeAdminSubdomain}.9jasub.com`;
            } else {
                 portalRoutingResult = "BLOCKED: Business Account Detected. Please login through the Reseller Portal.";
            }
        }
    } else if (sessionType === 'business') {
        if (user.role === 'admin' || user.role === 'superadmin') {
            portalRoutingResult = "BLOCKED: Admin accounts must use the Admin Portal.";
        } else if (!isBiz) {
            portalRoutingResult = "BLOCKED: This portal is for Business Console accounts only.";
        } else if (user.independence_redirect_enabled && activeAdminSubdomain) {
            portalRoutingResult = `REDIRECTED: targetUrl -> https://${activeAdminSubdomain}.9jasub.com`;
        }
    }

    console.log(`\n[Portal Routing Result]:`);
    console.log(` -> ${portalRoutingResult}`);
};

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtuapp').then(async () => {
    // reffar34 has referredBy set, so they can only log into their OWN portal.
    const reffarUsers = await User.find({ email: "reffar34@gmail.com" });
    const reffarPrimary = reffarUsers.find(u => u.role === 'reseller_admin');
    
    await simulateLogin("reffar34@gmail.com", null, "retail", "Main Platform");
    await simulateLogin("reffar34@gmail.com", reffarPrimary._id, "retail", "Their Own Website Owner Portal (refferdata)");
    
    // unuktar1 is an admin.
    await simulateLogin("unuktar1@gmail.com", null, "retail", "Main Platform");

    process.exit();
});
