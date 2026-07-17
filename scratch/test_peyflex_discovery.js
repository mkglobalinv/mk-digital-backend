import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = (process.env.PEYFLEX_API_URL || 'https://client.peyflex.com.ng').replace(/\/$/, '');
const TOKEN = process.env.PEYFLEX_API_TOKEN || process.env.PEYFLEX_API_KEY;

const headers = {
    'Authorization': `Token ${TOKEN}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

async function testEndpoint(name, url, method = 'GET', payload = null) {
    console.log(`\n--- Testing ${name} ---`);
    console.log(`${method} ${url}`);
    if (payload) console.log(`Payload: ${JSON.stringify(payload)}`);
    
    try {
        const response = await axios({
            method,
            url,
            headers,
            data: payload,
            timeout: 10000
        });
        console.log(`Status: ${response.status}`);
        console.log(`Data:`, JSON.stringify(response.data, null, 2));
    } catch (err) {
        if (err.response) {
            console.log(`Failed! Status: ${err.response.status}`);
            const errorData = err.response.data;
            if (typeof errorData === 'string' && errorData.startsWith('<')) {
                console.log(`Data: HTML Response (Truncated)`);
            } else {
                console.log(`Data:`, JSON.stringify(errorData, null, 2));
            }
        } else {
            console.log(`Failed! Error: ${err.message}`);
        }
    }
}

async function run() {
    // Airtime Purchase tests
    await testEndpoint('Airtime Purchase 1', `${BASE_URL}/api/airtime/`, 'POST', { network: 'mtn', amount: 10, mobile_number: '08133131020', airtime_type: 'VTU' });
    await testEndpoint('Airtime Purchase 2', `${BASE_URL}/api/airtime/purchase/`, 'POST', { network: 'mtn', amount: 10, mobile_number: '08133131020', airtime_type: 'VTU' });
    await testEndpoint('Airtime Purchase 3', `${BASE_URL}/api/vtu/`, 'POST', { network: 'mtn', amount: 10, mobile_number: '08133131020', airtime_type: 'VTU' });

    // Cable tests
    await testEndpoint('Cable 1', `${BASE_URL}/api/cabletv/`, 'GET');
    await testEndpoint('Cable 2', `${BASE_URL}/api/tv/plans/`, 'GET');
    await testEndpoint('Cable 3', `${BASE_URL}/api/cable_tv/plans/`, 'GET');
    await testEndpoint('Cable 4', `${BASE_URL}/api/cable/`, 'GET');

    // Electricity Verify
    await testEndpoint('Elec Verify 2', `${BASE_URL}/api/electricity/verify/?meter_number=1111111111111&disco=ikeja-electric&identifier=electricity`, 'GET');
}

run();
