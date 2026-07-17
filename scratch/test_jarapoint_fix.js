import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

/**
 * This test script verifies that the backend sends the correct payload to Jarapoint
 * by calling the buyDataWithJarapoint function directly (or simulating it).
 */

async function testJarapointFix() {
    const JARAPOINT_API_URL = "https://jarapoint.com/api";
    const JARAPOINT_API_KEY = process.env.JARAPOINT_API_KEY;

    if (!JARAPOINT_API_KEY) {
        console.error("JARAPOINT_API_KEY missing in .env");
        return;
    }

    // Testing with one specific plan ID as requested
    const testPlan = "mtn_sme_1_weeks_2_gb";
    const testPhone = "08133131020";
    
    const parts = testPlan.split('_');
    const planProvider = parts.slice(0, 2).join('_').toLowerCase();
    
    const payload = {
        provider: planProvider,
        recipient: testPhone,
        plan: testPlan,
        ref: `TEST-${Date.now()}`
    };

    console.log("Simulating purchase with payload:", JSON.stringify(payload, null, 2));

    try {
        const response = await axios.post(`${JARAPOINT_API_URL}/data/`, payload, {
            headers: { 
                'Authorization': `Token ${JARAPOINT_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("Response:", response.data);
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
    }
}

testJarapointFix();
