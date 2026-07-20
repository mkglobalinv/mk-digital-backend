import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { checkProviderAvailability } from './services/providerMonitoringService.js';
import { buyData } from './services/vtuService.js';
import User from './models/User.js';
import ProviderStatus from './models/ProviderStatus.js';

dotenv.config();

const runTests = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB.");

        // 1. Verify both providers are detected correctly
        const peyflex = await ProviderStatus.findOne({ providerName: 'peyflex' });
        const clubkonnect = await ProviderStatus.findOne({ providerName: 'clubkonnect' });
        console.log(`[Test] Peyflex Available: ${peyflex?.isAvailable}`);
        console.log(`[Test] ClubKonnect Available: ${clubkonnect?.isAvailable}`);

        // Temporarily ensure Peyflex is marked available for the test
        if (!peyflex.isAvailable) {
            console.log("Forcing Peyflex online for test...");
            peyflex.isAvailable = true;
            peyflex.apiStatus = 'healthy';
            peyflex.failureCount = 0;
            await peyflex.save();
        }

        // 2. Confirm checkProviderAvailability returns true
        const isAvailable = await checkProviderAvailability('data', 'MTN', 'smart', 'NG');
        console.log(`[Test] checkProviderAvailability('data', 'MTN'): ${isAvailable}`);

        if (!isAvailable) {
            throw new Error("checkProviderAvailability returned false even with healthy provider!");
        }

        // Setup test user
        const testEmail = 'test_purchaser_123@example.com';
        let user = await User.findOne({ email: testEmail });
        if (!user) {
            user = await User.create({
                name: 'Test Purchaser',
                email: testEmail,
                password: 'password123',
                balance1: 5000,
                sandboxBalance: 5000
            });
        } else {
            user.balance1 = 5000;
            await user.save();
        }
        
        console.log(`[Test] Test user balance: ${user.balance1}`);

        // 3. Purchase MTN data successfully
        // We will call smartBuyData directly to avoid express auth overhead, 
        // but wait, smartBuyData doesn't deduct wallet, the route does!
        // To test the FULL flow including wallet deduction, we need to hit the route.
        // Wait, the prompt says "Confirm wallet deduction and transaction recording still work".
        // I can just import the logic or use an API token.
        console.log("Creating API token...");
        const jwt = (await import('jsonwebtoken')).default;
        const token = jwt.sign({ id: user._id, role: 'user', apiLevel: 'retail' }, process.env.JWT_SECRET);
        
        const axios = (await import('axios')).default;
        const baseUrl = 'http://localhost:8800/api';
        
        // Let's buy MTN data
        // First we need a valid MTN plan ID
        const mtnPlan = 'mtn-data-1'; // dummy, let's fetch real plans
        const plansRes = await axios.get(`${baseUrl}/data/plans`, {
            headers: { Authorization: `Bearer ${token}` }
        }).catch(e => e.response);
        
        const mtnPlanId = plansRes.data.data.find(p => p.network === 'MTN' || p.network === 'mtn_gifting_data')?.plan_id || '500';
        const airtelPlanId = plansRes.data.data.find(p => p.network === 'Airtel' || p.network === 'airtel_data')?.plan_id || '200';

        console.log(`[Test] Buying MTN Data with plan ID: ${mtnPlanId}`);
        const mtnRes = await axios.post(`${baseUrl}/data`, {
            network: 'MTN',
            plan_id: mtnPlanId,
            phone: '08030000000',
            reference: 'TEST_MTN_' + Date.now()
        }, {
            headers: { Authorization: `Bearer ${token}` }
        }).catch(e => e.response);

        console.log(`[Test] MTN Purchase Status: ${mtnRes.status} - ${JSON.stringify(mtnRes.data)}`);

        console.log(`[Test] Buying Airtel Data with plan ID: ${airtelPlanId}`);
        const airtelRes = await axios.post(`${baseUrl}/data`, {
            network: 'AIRTEL',
            plan_id: airtelPlanId,
            phone: '08020000000',
            reference: 'TEST_AIRTEL_' + Date.now()
        }, {
            headers: { Authorization: `Bearer ${token}` }
        }).catch(e => e.response);

        console.log(`[Test] Airtel Purchase Status: ${airtelRes.status} - ${JSON.stringify(airtelRes.data)}`);

        // Check wallet deduction
        const updatedUser = await User.findById(user._id);
        console.log(`[Test] Wallet Balance After: ${updatedUser.balance1} (Expected < 5000)`);
        if (updatedUser.balance1 >= 5000 && mtnRes.data.status !== 'error') {
            console.error("Wallet was not deducted!");
        }

        // Test failover
        console.log("Simulating both providers going offline...");
        peyflex.isAvailable = false;
        peyflex.apiStatus = 'disconnected';
        await peyflex.save();

        clubkonnect.isAvailable = false;
        clubkonnect.apiStatus = 'disconnected';
        await clubkonnect.save();

        console.log("Both marked offline. Checking checkProviderAvailability...");
        const isAvailOff = await checkProviderAvailability('data', 'MTN', 'smart', 'NG');
        console.log(`[Test] checkProviderAvailability('data', 'MTN'): ${isAvailOff}`);

        console.log("Attempting purchase while offline...");
        const failRes = await axios.post(`${baseUrl}/data`, {
            network: 'MTN',
            plan_id: mtnPlanId,
            phone: '08030000000',
            reference: 'TEST_FAIL_' + Date.now()
        }, {
            headers: { Authorization: `Bearer ${token}` }
        }).catch(e => e.response);

        console.log(`[Test] Offline Purchase Status: ${failRes.status} - ${JSON.stringify(failRes.data)}`);
        
        if (failRes.status === 400 && failRes.data.message.includes('temporarily unavailable')) {
            console.log("[Test] Purchase successfully blocked when providers are offline.");
        } else {
            console.error("[Test] Purchase was NOT blocked properly.");
        }

        console.log("Restoring Peyflex to online for normal operations...");
        peyflex.isAvailable = true;
        peyflex.apiStatus = 'healthy';
        await peyflex.save();

        console.log("Tests completed.");
    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        mongoose.disconnect();
    }
};

runTests();
