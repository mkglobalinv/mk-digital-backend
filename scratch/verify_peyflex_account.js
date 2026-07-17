import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = (process.env.PEYFLEX_API_URL || 'https://client.peyflex.com.ng').replace(/\/$/, '');
const TOKEN = process.env.PEYFLEX_API_TOKEN;

const headers = {
    'Authorization': `Token ${TOKEN}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

async function testEndpoint(name, url, method = 'GET', payload = null) {
    console.log(`\n======================================`);
    console.log(`[CHECK] ${name}`);
    console.log(`Endpoint: ${method} ${url}`);
    if (payload) console.log(`Payload: ${JSON.stringify(payload)}`);
    
    try {
        const response = await axios({
            method,
            url,
            headers,
            data: payload,
            timeout: 15000
        });
        console.log(`\n[SUCCESS] HTTP Status: ${response.status}`);
        console.log(`Response Body:`, JSON.stringify(response.data, null, 2));
        return { success: true, data: response.data, status: response.status };
    } catch (err) {
        console.log(`\n[FAILED] HTTP Status: ${err.response ? err.response.status : 'N/A'}`);
        if (err.response) {
            const errorData = err.response.data;
            if (typeof errorData === 'string' && errorData.startsWith('<')) {
                console.log(`Error Response: HTML Page (Truncated) - Likely 404 or Server Error`);
            } else {
                console.log(`Error Response:`, JSON.stringify(errorData, null, 2));
            }
            return { success: false, data: errorData, status: err.response.status };
        } else {
            console.log(`Error Message: ${err.message}`);
            return { success: false, error: err.message };
        }
    }
}

async function runTests() {
    console.log(`Using Base URL: ${BASE_URL}`);
    console.log(`Using Token: ${TOKEN ? '***'+TOKEN.slice(-4) : 'MISSING'}`);
    
    if (!TOKEN) {
        console.error("No API Token found in environment!");
        return;
    }

    // 1. Profile / Balance Check
    console.log(`\n\n>>> 1. Checking Account Profile & Balance (Validating Credentials & IP Whitelist)`);
    const profileRes = await testEndpoint('User Profile', `${BASE_URL}/api/user/profile/`, 'GET');
    
    if (profileRes.status === 401 || profileRes.status === 403) {
        console.error(`\n[FATAL] Authentication failed! Credentials invalid or IP is not whitelisted.`);
        return;
    }

    // 3. Find 1GB plan
    console.log(`\n\n>>> 3. Searching for 1GB Plan Code`);
    const networks = ['mtn_gifting_data', 'mtn_data_share', 'mtn_sme_data', 'mtn_awoof_gifting'];
    let foundNetwork = null;
    let foundPlan = null;
    
    for (const net of networks) {
        const res = await testEndpoint(`MTN Plans (${net})`, `${BASE_URL}/api/data/plans/?network=${net}`, 'GET');
        if (res.success && res.data.plans) {
            const plan = res.data.plans.find(p => p.plan_code === '1GB' || p.plan_code === 'M1GB');
            if (plan) {
                foundNetwork = net;
                foundPlan = plan;
                console.log(`\n*** Found 1GB Plan in ${net}:`, plan);
                break;
            }
        }
    }

    if (!foundPlan) {
        console.log(`\n*** 1GB Plan Code NOT FOUND in any MTN network! Using generic test with 1GB.`);
        foundNetwork = 'mtn_gifting_data';
    }

    // 4. Direct Purchase Execution (1GB)
    console.log(`\n\n>>> 4. Executing Direct API Purchase Test (1GB)`);
    console.log(`Note: This uses real API credentials and will deduct balance if successful.`);
    
    const purchasePayload = {
        network: foundNetwork,
        plan_code: "1GB",
        mobile_number: "08133131020",
        ported_number: true
    };
    
    await testEndpoint('Data Purchase Execution (1GB)', `${BASE_URL}/api/data/purchase/`, 'POST', purchasePayload);
    
    console.log(`\n======================================`);
    console.log(`Test Execution Complete.`);
}

runTests();
