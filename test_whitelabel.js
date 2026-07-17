import mongoose from 'mongoose';
import FuturePlatform from './models/FuturePlatform.js';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mkdigital');
        console.log("Connected to DB.");

        // Clean up previous test data if any
        await FuturePlatform.deleteMany({ name: { $in: ['Campus Test', 'Learn Test', 'AI Test', 'BBC Hausa'] } });
        await User.deleteMany({ email: 'whitelabel_test@example.com' });

        // Insert Test Platforms
        await FuturePlatform.insertMany([
            { name: 'Campus Test', retailDisplayName: 'MK Campus', ownerDisplayNameTemplate: '{Brand} Campus', url: 'https://campus.example.com', mode: 'external', status: true, displayOrder: 1 },
            { name: 'Learn Test', retailDisplayName: 'MK Learn', ownerDisplayNameTemplate: '{Brand} Learn', url: 'https://learn.example.com', mode: 'external', status: true, displayOrder: 2 },
            { name: 'AI Test', retailDisplayName: 'MK AI', ownerDisplayNameTemplate: '{Brand} AI', url: 'https://ai.example.com', mode: 'external', status: true, displayOrder: 3 },
            { name: 'BBC Hausa', retailDisplayName: 'BBC Hausa', ownerDisplayNameTemplate: '{Brand} BBC Hausa', url: 'https://bbc.com/hausa', mode: 'external', status: true, displayOrder: 4 }
        ]);

        // Insert Test Reseller
        const reseller = new User({
            name: 'Test Reseller',
            email: 'whitelabel_test@example.com',
            password: 'password123',
            phone: '08123456789',
            role: 'reseller_admin',
            branding: { siteName: 'Apex Data' }
        });
        await reseller.save();

        console.log("\n--- TEST 1: Retail User (No resellerId passed) ---");
        // Simulate getAvailablePlatforms
        const req1 = { query: {} };
        let res1Data = null;
        const res1 = { json: (data) => { res1Data = data; }, status: () => res1 };
        
        await getAvailablePlatformsTest(req1, res1);
        console.log(res1Data.filter(p => ['Campus Test', 'Learn Test', 'AI Test', 'BBC Hausa'].includes(p.name)).map(p => p.displayName));


        console.log("\n--- TEST 2: Website Owner Customer (resellerId passed) ---");
        const req2 = { query: { resellerId: reseller._id.toString() } };
        let res2Data = null;
        const res2 = { json: (data) => { res2Data = data; }, status: () => res2 };
        
        await getAvailablePlatformsTest(req2, res2);
        console.log(res2Data.filter(p => ['Campus Test', 'Learn Test', 'AI Test', 'BBC Hausa'].includes(p.name)).map(p => p.displayName));

        // Cleanup
        await FuturePlatform.deleteMany({ name: { $in: ['Campus Test', 'Learn Test', 'AI Test', 'BBC Hausa'] } });
        await User.deleteMany({ email: 'whitelabel_test@example.com' });
        
        mongoose.disconnect();
    } catch (err) {
        console.error("Test failed", err);
    }
};

const getAvailablePlatformsTest = async (req, res) => {
    const platforms = await FuturePlatform.find({ status: true }).sort({ displayOrder: 1 });
    const { resellerId } = req.query;
    let siteName = null;
    
    if (resellerId) {
        const reseller = await User.findById(resellerId);
        if (reseller && reseller.branding && reseller.branding.siteName) {
            siteName = reseller.branding.siteName;
        }
    }
    
    const processedPlatforms = platforms.map(p => {
        let displayName = p.retailDisplayName;
        
        if (p.name === "BBC Hausa") {
            displayName = "BBC Hausa";
        } else if (siteName) {
            displayName = p.ownerDisplayNameTemplate.replace(/{Brand}/gi, siteName);
        }
        
        return {
            _id: p._id,
            name: p.name,
            displayName,
            logoUrl: p.logoUrl,
            url: p.url,
            mode: p.mode
        };
    });
    
    res.json(processedPlatforms);
};

runTest();
