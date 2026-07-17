import mongoose from 'mongoose';
import User from './models/User.js';
import FuturePlatform from './models/FuturePlatform.js';
import dotenv from 'dotenv';
dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mkdigital');
        console.log("Connected to DB.");

        await User.deleteMany({ email: 'ecosystem_test@example.com' });
        await FuturePlatform.deleteMany({ name: 'Eco Test Platform' });

        console.log("\n--- TEST 1: Future Platform Admin Controls ---");
        const platform = new FuturePlatform({
            name: 'Eco Test Platform',
            retailDisplayName: 'Eco Retail',
            ownerDisplayNameTemplate: '{Brand} Eco',
            url: 'https://eco.com',
            mode: 'internal',
            status: true,
            displayOrder: 99
        });
        await platform.save();
        console.log(`✓ Platform created: ${platform.name} (Status: ${platform.status})`);

        console.log("\n--- TEST 2: Website Owner Feature Toggles ---");
        const reseller = new User({
            name: 'Eco Reseller',
            email: 'ecosystem_test@example.com',
            password: 'password123',
            phone: '08133333333',
            role: 'reseller_admin',
            resellerTier: 'basic',
            enabledFuturePlatforms: []
        });
        await reseller.save();
        console.log(`✓ Reseller created with 0 enabled platforms.`);

        // Toggle ON
        reseller.enabledFuturePlatforms.push(platform._id.toString());
        await reseller.save();
        console.log(`✓ Reseller toggled platform ON. Enabled count: ${reseller.enabledFuturePlatforms.length}`);

        // Toggle OFF
        reseller.enabledFuturePlatforms = reseller.enabledFuturePlatforms.filter(id => id !== platform._id.toString());
        await reseller.save();
        console.log(`✓ Reseller toggled platform OFF. Enabled count: ${reseller.enabledFuturePlatforms.length}`);

        console.log("\n--- TEST 3: Website Generation & Website Ready State ---");
        reseller.subdomain = 'ecotest';
        reseller.resellerActivationStatus = 'active'; // Setup complete
        reseller.resellerTier = 'basic'; 
        reseller.isResellerActivated = false; // Still on trial
        await reseller.save();
        console.log(`✓ Website generated. URL: https://${reseller.subdomain}.9jasub.com`);
        console.log(`✓ Activation Status: ${reseller.resellerActivationStatus} | isActivated: ${reseller.isResellerActivated}`);
        console.log(`✓ Website Ready State (Frontend Logic Check): ${reseller.resellerActivationStatus === 'active' && reseller.resellerTier === 'basic' && !reseller.isResellerActivated ? 'TRIGGERED' : 'HIDDEN'}`);

        // Cleanup
        await User.deleteMany({ email: 'ecosystem_test@example.com' });
        await FuturePlatform.deleteMany({ name: 'Eco Test Platform' });

        mongoose.disconnect();
        console.log("\nEcosystem Test Suite Completed Successfully.");
    } catch (err) {
        console.error("Test failed", err);
    }
};

runTest();
