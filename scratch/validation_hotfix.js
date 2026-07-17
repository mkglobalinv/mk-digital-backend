import 'dotenv/config';
import mongoose from 'mongoose';
import DataPlan from '../models/DataPlan.js';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        console.log("\n--- Network Isolation Validation ---");
        // Create dummy plans to test isolation
        const apiPlanId = 'TEST_HOTFIX_ID';
        
        await DataPlan.deleteMany({ api_plan_id: apiPlanId }); // cleanup
        
        await DataPlan.create([
            { network: 'MTN', api_plan_id: apiPlanId, category: 'Test', plan_name: 'Test', api_price: 100, selling_price: 110, provider: 'peyflex', status: true },
            { network: 'GLO', api_plan_id: apiPlanId, category: 'Test', plan_name: 'Test', api_price: 100, selling_price: 110, provider: 'peyflex', status: true },
            { network: 'AIRTEL', api_plan_id: apiPlanId, category: 'Test', plan_name: 'Test', api_price: 100, selling_price: 110, provider: 'peyflex', status: true },
            { network: '9MOBILE', api_plan_id: apiPlanId, category: 'Test', plan_name: 'Test', api_price: 100, selling_price: 110, provider: 'peyflex', status: true }
        ]);

        // Simulate admin update logic for MTN
        const targetNetwork = 'MTN';
        const newSellingPrice = 150;
        await DataPlan.updateMany({ api_plan_id: apiPlanId, network: targetNetwork }, { selling_price: newSellingPrice });

        const mtnPlan = await DataPlan.findOne({ api_plan_id: apiPlanId, network: 'MTN' });
        const gloPlan = await DataPlan.findOne({ api_plan_id: apiPlanId, network: 'GLO' });
        const airtelPlan = await DataPlan.findOne({ api_plan_id: apiPlanId, network: 'AIRTEL' });
        const nineMobilePlan = await DataPlan.findOne({ api_plan_id: apiPlanId, network: '9MOBILE' });

        console.log(`MTN Price: ${mtnPlan.selling_price} (Expected: 150) -> ${mtnPlan.selling_price === 150 ? 'PASS' : 'FAIL'}`);
        console.log(`GLO Price: ${gloPlan.selling_price} (Expected: 110) -> ${gloPlan.selling_price === 110 ? 'PASS' : 'FAIL'}`);
        console.log(`AIRTEL Price: ${airtelPlan.selling_price} (Expected: 110) -> ${airtelPlan.selling_price === 110 ? 'PASS' : 'FAIL'}`);
        console.log(`9MOBILE Price: ${nineMobilePlan.selling_price} (Expected: 110) -> ${nineMobilePlan.selling_price === 110 ? 'PASS' : 'FAIL'}`);

        console.log("\n--- Active Plan Validation ---");
        const realPlanId = 'TEST_ACTIVE_ID';
        await DataPlan.deleteMany({ api_plan_id: realPlanId }); // cleanup

        // Create an old deactivated plan (first in DB)
        const oldPlan = await DataPlan.create({
            network: 'MTN', api_plan_id: realPlanId, category: 'Test', plan_name: 'Old Deactivated', 
            api_price: 100, selling_price: 120, provider: 'old_provider', status: false
        });

        // Create the new active plan
        const newPlan = await DataPlan.create({
            network: 'MTN', api_plan_id: realPlanId, category: 'Test', plan_name: 'New Active', 
            api_price: 100, selling_price: 130, provider: 'new_provider', status: true
        });

        // Simulate calculateVtuPrice lookup
        const selectedPlan = await DataPlan.findOne({ api_plan_id: realPlanId, network: 'MTN', status: true });
        
        if (selectedPlan) {
            console.log(`calculateVtuPrice selected plan: ${selectedPlan.plan_name}`);
            console.log(`Selected plan status: ${selectedPlan.status}`);
            console.log(`Selected plan selling_price: ${selectedPlan.selling_price}`);
            console.log(`Active Plan Validation: ${selectedPlan._id.toString() === newPlan._id.toString() ? 'PASS' : 'FAIL'}`);
        } else {
            console.log("No plan found!");
        }

        // Cleanup
        await DataPlan.deleteMany({ api_plan_id: apiPlanId });
        await DataPlan.deleteMany({ api_plan_id: realPlanId });

        console.log("\nValidation tests complete.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
