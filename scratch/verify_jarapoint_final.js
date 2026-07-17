import { fetchDataPlansFromJarapoint } from '../services/providers/jarapoint.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log("Testing Jarapoint Plan Fetching...");
    try {
        const result = await fetchDataPlansFromJarapoint("MTN");
        if (result.success) {
            console.log("SUCCESS! Found", result.plans.length, "plans.");
            console.log("Example plan:", result.plans[0]);
            
            // Try to test a purchase with a valid plan ID from the list
            if (result.plans.length > 0) {
                console.log("\nTesting buyDataWithJarapoint with plan:", result.plans[0].plan_id);
                // Note: We won't actually call it here unless we want to spend money, 
                // but we'll check the function logic.
            }
        } else {
            console.log("FAILED:", result.message);
            console.log("Result object:", JSON.stringify(result, null, 2));
        }
    } catch (e) {
        console.log("CRASH:", e.message);
    }
    process.exit();
}

test();
