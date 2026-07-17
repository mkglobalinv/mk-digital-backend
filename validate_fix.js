import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import jwt from "jsonwebtoken";
import { getSupabaseClient } from "./services/supabaseClient.js";
import DataPlan from "./models/DataPlan.js";

dotenv.config();

const validateFix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const supabase = getSupabaseClient();
        
        // 1. Get a master plan from Supabase that matches a plan in DB
        const allPlans = await DataPlan.find({});
        console.log(`There are ${allPlans.length} plans in the DataPlan collection.`);
        
        let testPlan;
        for (const plan of allPlans) {
            const { data: masterPlans, error } = await supabase
                .from('data_plans_master')
                .select('*')
                .eq('provider_plan_id', plan.api_plan_id)
                .limit(1);
            if (masterPlans && masterPlans.length > 0) {
                testPlan = masterPlans[0];
                break;
            }
        }

        if (!testPlan) {
            console.error("Failed to find a matching plan between DB and Supabase");
            process.exit(1);
        }

        const supabasePlanId = testPlan.id;
        const providerPlanId = testPlan.provider_plan_id;
        
        // 2. Ensure admin is verified
        console.log(`\n--- Ensuring admin email is verified ---`);
        const User = mongoose.model('User', new mongoose.Schema({ email: String, isEmailVerified: Boolean, role: String, isSuspended: Boolean, failedLoginAttempts: Number, lockoutUntil: Date, isSignupComplete: Boolean }, { strict: false }));
        await User.updateOne({ email: 'admin@system.local' }, { $set: { isEmailVerified: true, isSignupComplete: true, isSuspended: false, failedLoginAttempts: 0, lockoutUntil: null } });

        // 3. Login to get a valid token
        console.log(`\n--- Logging in as admin ---`);
        const loginRes = await axios.post('http://localhost:8800/login', {
            email: 'admin@system.local',
            password: 'AdminTempPass123!',
            session_type: 'retail'
        });
        const token = loginRes.data.token;
        console.log(`Login successful. Token obtained.`);



        // 3. Check current price in MongoDB
        console.log(`\n--- Fetching Current Price from MongoDB ---`);
        const preCheck = await DataPlan.findOne({ api_plan_id: providerPlanId });
        const oldPrice = preCheck ? preCheck.selling_price : 0;
        console.log(`Current DB Price: ₦${oldPrice}`);

        // 4. Update the price via Admin API (Simulating React UI Save)
        const newPrice = Number(oldPrice) === 999 ? 1234 : 999;
        console.log(`\n--- Admin Saving New Price: ₦${newPrice} ---`);
        
        const updateRes = await axios.post('http://localhost:8800/api/admin/pricing/retail', {
            plan_id: supabasePlanId,
            selling_price: newPrice
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`Admin API Response:`, updateRes.data);

        // 5. Verify the updated price in MongoDB
        console.log(`\n--- Fetching Updated Price from MongoDB ---`);
        const postCheck = await DataPlan.findOne({ api_plan_id: providerPlanId });
        
        console.log(`New DB Price: ₦${postCheck.selling_price}`);
        
        if (Number(postCheck.selling_price) === newPrice) {
            console.log(`\n✅ VALIDATION SUCCESS: The price successfully synced to the live MongoDB collection!`);
        } else {
            console.log(`\n❌ VALIDATION FAILED: The price did not sync.`);
        }

        process.exit(0);
    } catch (err) {
        console.error("Validation Error:", err.response ? err.response.data : err.message);
        process.exit(1);
    }
};

validateFix();
