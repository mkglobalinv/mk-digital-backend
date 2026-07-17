import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

import User from '../models/User.js';
import Session from '../models/Session.js';

async function main() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        // 1. Find Admin user
        const adminEmail = "unuktar1@gmail.com";
        const admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            console.error(`ERROR: Admin user ${adminEmail} not found`);
            process.exit(1);
        }
        console.log(`Found Admin: ${admin._id} | Role: ${admin.role}`);

        // 2. Generate a valid session JWT token
        const secret = process.env.JWT_SECRET || 'mk_sub_data_secret_2024_premium';
        const token = jwt.sign({ id: admin._id.toString(), session_type: 'retail' }, secret, { expiresIn: '1h' });

        // 3. Insert valid session into Database
        const session = await Session.create({
            userId: admin._id,
            token: token,
            deviceInfo: "Audit Script",
            isValid: true
        });
        console.log(`Created Session: ${session._id}`);

        const headers = { Authorization: `Bearer ${token}` };

        // 4. Perform Clones
        const networksToClone = ['AIRTEL', 'GLO', '9MOBILE'];
        
        for (const net of networksToClone) {
            console.log(`\n---------------------------------------`);
            console.log(`[CLONE] Triggering MTN -> ${net}...`);
            
            const payload = {
                sourceNetwork: "MTN",
                destinationNetwork: net
            };
            
            try {
                const res = await axios.post('http://localhost:8800/api/admin/pricing-rules/clone', payload, { headers });
                console.log(`Status: ${res.status} | Data:`, JSON.stringify(res.data));
                
                // Verify PricingRules count for this network in DB
                const dbRules = await mongoose.connection.db.collection('pricingrules').find({ network: net }).toArray();
                console.log(`[DB Verification] Rules in DB for ${net}: ${dbRules.length}`);
                for (const r of dbRules) {
                    console.log(`  - Category: ${r.category} | isActive: ${r.isActive} | retail: ${r.retailPercentage}%`);
                }
            } catch (err) {
                console.error(`[CLONE ERROR] Failed MTN -> ${net}:`, err.response ? err.response.data : err.message);
                // Clean up session and exit
                await Session.deleteOne({ _id: session._id });
                process.exit(1);
            }
        }

        console.log(`\n---------------------------------------`);
        console.log("[VERIFICATION] Fetching /api/vtu/data-plans/all...");
        try {
            const res = await axios.get('http://localhost:8800/api/vtu/data-plans/all', { headers });
            const allPlans = res.data.plans || res.data || [];
            console.log(`Fetched plans count: ${allPlans.length}`);
            
            // Group by network and print plan counts
            const counts = {};
            for (const p of allPlans) {
                counts[p.network] = (counts[p.network] || 0) + 1;
            }
            console.log("Returned plans per network:");
            console.log(JSON.stringify(counts, null, 2));
        } catch (err) {
            console.error("[VERIFICATION ERROR] Failed to fetch data-plans/all:", err.response ? err.response.data : err.message);
        }

        // 5. Cleanup session
        await Session.deleteOne({ _id: session._id });
        console.log("\nCleanup complete. Session deleted.");
        process.exit(0);

    } catch (e) {
        console.error("Critical Error:", e.message);
        process.exit(1);
    }
}

main();
