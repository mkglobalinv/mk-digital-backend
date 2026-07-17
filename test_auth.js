import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const runTests = async () => {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mksubdata");
    
    // Create test accounts if they don't exist
    const createTestUser = async (email, role, resellerActivationStatus = 'none') => {
        let u = await User.findOne({ email });
        if (!u) {
            u = new User({
                name: 'Test ' + role,
                email,
                password: 'TestPassword123!',
                role,
                resellerActivationStatus,
                isSignupComplete: true,
                isEmailVerified: true
            });
            await u.save();
        } else {
            u.role = role;
            u.resellerActivationStatus = resellerActivationStatus;
            await u.save();
        }
    };

    await createTestUser('retail_test@example.com', 'user');
    await createTestUser('reseller_test@example.com', 'user', 'active'); // Business account
    await createTestUser('admin_test@example.com', 'admin');

    console.log("=== Auth Separation Tests ===");
    
    const doLogin = async (email, password, session_type) => {
        const res = await fetch('http://localhost:8800/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, session_type })
        });
        const data = await res.json();
        return { status: res.status, data };
    };

    console.log("\n1. RETAIL PORTAL (/login) - session_type: retail");
    
    let res = await doLogin('retail_test@example.com', 'TestPassword123!', 'retail');
    console.log("Retail User -> Retail Portal: ", res.status === 200 ? "ALLOW (Correct)" : "FAIL");

    res = await doLogin('reseller_test@example.com', 'TestPassword123!', 'retail');
    console.log("Reseller User -> Retail Portal: ", res.status === 403 ? "DENY (Correct)" : "FAIL");

    res = await doLogin('admin_test@example.com', 'TestPassword123!', 'retail');
    console.log("Admin User -> Retail Portal: ", res.status === 403 ? "DENY (Correct)" : "FAIL");

    console.log("\n2. RESELLER PORTAL (/business/login) - session_type: business");

    res = await doLogin('reseller_test@example.com', 'TestPassword123!', 'business');
    console.log("Reseller User -> Reseller Portal: ", res.status === 200 ? "ALLOW (Correct)" : "FAIL");

    res = await doLogin('retail_test@example.com', 'TestPassword123!', 'business');
    console.log("Retail User -> Reseller Portal: ", res.status === 403 ? "DENY (Correct)" : "FAIL");

    res = await doLogin('admin_test@example.com', 'TestPassword123!', 'business');
    console.log("Admin User -> Reseller Portal: ", res.status === 403 ? "DENY (Correct)" : "FAIL");

    console.log("\n3. ADMIN PORTAL (/api/admin/login)");
    
    const doAdminLogin = async (email, password) => {
        const res = await fetch('http://localhost:8800/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return { status: res.status };
    };

    res = await doAdminLogin('admin_test@example.com', 'TestPassword123!');
    console.log("Admin User -> Admin Portal: ", res.status === 200 ? "ALLOW (Correct)" : "FAIL");

    res = await doAdminLogin('retail_test@example.com', 'TestPassword123!');
    console.log("Retail User -> Admin Portal: ", res.status === 401 ? "DENY (Correct)" : "FAIL");

    res = await doAdminLogin('reseller_test@example.com', 'TestPassword123!');
    console.log("Reseller User -> Admin Portal: ", res.status === 401 ? "DENY (Correct)" : "FAIL");

    process.exit(0);
};

runTests().catch(console.error);
