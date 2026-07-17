import dotenv from "dotenv";
dotenv.config();

import { smartFetchDataPlans } from "./services/switcher.js";

async function runTests() {
    console.log("--- SMART (Peyflex) Data Plan Test ---");
    const networks = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];

    for (const network of networks) {
        try {
            console.log(`Fetching ${network} plans...`);
            const plans = await smartFetchDataPlans(network, 'smart');
            console.log(`✅ Found ${plans.length} plans for ${network} on SMART`);
        } catch (err) {
            console.log(`❌ Error fetching ${network} on SMART: ${err.message}`);
        }
    }
}

runTests();
