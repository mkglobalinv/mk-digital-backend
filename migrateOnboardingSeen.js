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
            // For existing resellers:
            // - If they have already activated, they should have both flags set to true so they are unaffected.
            // - If they are in trial, they should have welcomeBannerSeen = true (since they are already in the dashboard)
            //   and businessGuideSeen = false (so when they activate Basic, they will see the guide).
            if (reseller.isResellerActivated === true) {
                reseller.welcomeBannerSeen = true;
                reseller.businessGuideSeen = true;
            } else {
                reseller.welcomeBannerSeen = true;
                reseller.businessGuideSeen = false;
            }

            reseller.markModified('welcomeBannerSeen');
            reseller.markModified('businessGuideSeen');

            await reseller.save();
            migratedCount++;
            console.log(`Migrated reseller: ${reseller.email} -> isResellerActivated: ${reseller.isResellerActivated}, welcomeBannerSeen: ${reseller.welcomeBannerSeen}, businessGuideSeen: ${reseller.businessGuideSeen}`);
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
