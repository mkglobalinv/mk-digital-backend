import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import ProviderStatus from './models/ProviderStatus.js';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB.");

        // Reset Peyflex — it had a balance of 1895.64 on last successful check
        // and its only problem was transient ETIMEDOUT during cron polling.
        const peyflex = await ProviderStatus.findOne({ providerName: 'peyflex' });
        if (peyflex) {
            peyflex.isAvailable = true;
            peyflex.apiStatus = 'warning'; // keep as warning since balance < warningThreshold
            peyflex.failureCount = 0;
            await peyflex.save();
            console.log("Peyflex reset to available.");
        }

        // ClubKonnect — INVALID_CREDENTIALS is a real error, leave it offline.
        const clubkonnect = await ProviderStatus.findOne({ providerName: 'clubkonnect' });
        if (clubkonnect) {
            console.log(`ClubKonnect status: isAvailable=${clubkonnect.isAvailable}, apiStatus=${clubkonnect.apiStatus}, balance=${clubkonnect.balance}`);
            console.log("ClubKonnect left as-is (INVALID_CREDENTIALS is a genuine error).");
        }

        const providers = await ProviderStatus.find({ providerName: { $in: ['clubkonnect', 'peyflex'] } });
        for (const p of providers) {
            console.log(`[${p.providerName}] isAvailable=${p.isAvailable} | apiStatus=${p.apiStatus} | failureCount=${p.failureCount} | balance=${p.balance}`);
        }

        await mongoose.disconnect();
        console.log("Done.");
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
};
run();
