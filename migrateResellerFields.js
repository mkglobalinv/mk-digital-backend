import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp").then(async () => {
    console.log("Connected to MongoDB.");

    try {
        const resellers = await User.find({ role: 'reseller_admin' });
        console.log(`Found ${resellers.length} reseller accounts to migrate.`);

        let migratedCount = 0;
        for (const reseller of resellers) {
            const tier = reseller.resellerTier || 'basic';
            const isPremium = tier === 'premium' || tier === 'vip';
            
            reseller.resellerType = isPremium ? 'premium' : 'basic';
            reseller.canOverridePricing = isPremium;
            
            if (!reseller.assignedPrices) reseller.assignedPrices = new Map();
            if (!reseller.customPrices) reseller.customPrices = new Map();

            // Explicitly mark fields as modified to guarantee Mongoose writes them
            reseller.markModified('resellerType');
            reseller.markModified('canOverridePricing');
            reseller.markModified('assignedPrices');
            reseller.markModified('customPrices');

            await reseller.save();
            migratedCount++;
            console.log(`Force-migrated reseller: ${reseller.email} -> Type: ${reseller.resellerType}, Override pricing: ${reseller.canOverridePricing}`);
        }

        console.log(`Migration complete! Successfully updated ${migratedCount} reseller profiles.`);
    } catch (e) {
        console.error("Migration failed:", e);
    }

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
