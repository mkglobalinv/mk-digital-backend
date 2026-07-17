import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = (await import("../models/User.js")).default;
        
        console.log("=== REQUEST ===");
        console.log("URL: /api/reseller/register-with-payment");
        console.log("Method: POST");
        console.log("Headers: { host: 'localhost:5173', 'content-type': 'application/json' }");
        
        const payload = {
            name: 'Forensic Duplicate Test',
            email: 'forensic.dup.999@example.com',
            phone: '08000000000',
            businessName: 'Forensic Store',
            password: 'Password123!',
            state: 'Lagos',
            enabledFuturePlatforms: []
        };
        console.log("Body:", JSON.stringify(payload, null, 2));
        
        console.log("\n=== EXECUTION TRACE ===");
        console.log("1. routes/resellerRoutes.js: restrictToMainDomain");
        console.log("2. controllers/resellerController.js: registerResellerWithPayment");
        
        console.log("\n=== DATABASE OPERATIONS ===");
        console.log("Query: User.findOne({ email: 'forensic.dup.999@example.com' })");
        let existing = await User.findOne({ email: payload.email.toLowerCase() });
        console.log("Returned:", existing ? "Document found" : "null");
        
        let isUpgrade = false;
        if (existing) {
            isUpgrade = true;
        }

        const hashedPassword = await bcrypt.hash(payload.password, 10);
        let baseSubdomain = payload.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!baseSubdomain) baseSubdomain = 'store';
        
        let uniqueSubdomain = baseSubdomain;
        let counter = 1;
        while (true) {
            console.log(`Query: User.findOne({ $or: [{ subdomain: '${uniqueSubdomain}' }, { admin_subdomain: '${uniqueSubdomain}' }] })`);
            const sub = await User.findOne({ $or: [{ subdomain: uniqueSubdomain }, { admin_subdomain: uniqueSubdomain }] });
            console.log("Returned:", sub ? `Document found (_id: ${sub._id})` : "null");
            if (!sub) break;
            uniqueSubdomain = `${baseSubdomain}${counter}`;
            counter++;
        }
        
        let targetUser;
        if (isUpgrade) {
            targetUser = existing;
            targetUser.subdomain = uniqueSubdomain;
            targetUser.admin_subdomain = uniqueSubdomain;
        } else {
            targetUser = new User({
                name: payload.name || payload.businessName,
                email: payload.email.toLowerCase(),
                phone: payload.phone,
                password: hashedPassword,
                role: "reseller_admin",
                resellerActivationStatus: "pending_onboarding",
                whiteLabelStatus: "pending",
                isResellerActivated: false,
                resellerTier: "basic",
                trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                isEmailVerified: true,
                isSignupComplete: true,
                subdomain: uniqueSubdomain,
                admin_subdomain: uniqueSubdomain,
                independence_redirect_enabled: true,
                branding: {
                    siteName: payload.businessName,
                    contactEmail: payload.email.toLowerCase(),
                    whatsappNumber: payload.phone
                },
                enabledFuturePlatforms: payload.enabledFuturePlatforms || []
            });
        }

        console.log("\n=== save() Investigation ===");
        console.log("Document before save:");
        console.log(JSON.stringify(targetUser.toObject(), null, 2));
        
        console.log("\nMongoose Validation (validateSync):");
        const valErr = targetUser.validateSync();
        if (valErr) {
            console.log(valErr);
        } else {
            console.log("PASS");
        }
        
        console.log("\nModified Paths:", targetUser.modifiedPaths());
        
        console.log("\nCollection Indexes:");
        const idx = await User.collection.indexes();
        console.log(JSON.stringify(idx, null, 2));
        
        try {
            console.log("\nExecuting targetUser.save()...");
            await targetUser.save();
            console.log("\nDocument after save:");
            console.log("Returned _id:", targetUser._id);
            console.log("createdAt:", targetUser.createdAt);
            console.log("updatedAt:", targetUser.updatedAt);
        } catch (err) {
            console.log("\n=== Exceptions ===");
            console.log("Name:", err.name);
            console.log("Message:", err.message);
            console.log("Code:", err.code);
            console.log("CodeName:", err.codeName);
            console.log("KeyPattern:", JSON.stringify(err.keyPattern));
            console.log("KeyValue:", JSON.stringify(err.keyValue));
            console.log("Stack:", err.stack);
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
