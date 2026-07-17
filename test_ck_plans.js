import { fetchDataPlansFromClubkonnect } from './services/providers/clubkonnect.js';
import dotenv from 'dotenv';
dotenv.config();

async function testPlans() {
    console.log("--- Testing ClubKonnect Plans Fetching ---");
    try {
        const result = await fetchDataPlansFromClubkonnect('MTN');
        if (result.success) {
            console.log("SUCCESS! Plans found:", result.plans.length);
            console.log("Sample Plan:", JSON.stringify(result.plans[0], null, 2));
        } else {
            console.log("FAILED:", result.message);
        }
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}

testPlans();
