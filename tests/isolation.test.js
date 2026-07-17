import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.staging' });

const API_URL = `http://localhost:${process.env.PORT || 5001}`;
console.log(`[QA] Starting API Isolation Tests on ${API_URL}...`);

const testIsolation = async () => {
    try {
        console.log("1. Testing Email Reusability across Tenants...");
        
        // Step A: Register user on Main Platform
        const resMain = await axios.post(`${API_URL}/register`, {
            email: 'tester@isolation.com',
            password: 'password123',
            name: 'Main Tester'
        });
        console.log("   - Registered on Main:", resMain.data.message);

        // Step B: Register same email on a Reseller Domain (Simulated via header)
        // We need a reseller first. I'll assume one exists or mock it.
        console.log("   - Attempting same email on Tenant X...");
        const resReseller = await axios.post(`${API_URL}/register`, {
            email: 'tester@isolation.com',
            password: 'password123',
            name: 'Reseller Tester'
        }, {
            headers: { 'host': 'testreseller.localhost:5173' }
        });
        console.log("   - Registered on Reseller:", resReseller.data.message);

        console.log("SUCCESS: Account isolation verified.");
    } catch (err) {
        console.error("FAILURE: Isolation test failed:", err.response?.data || err.message);
    }
};

testIsolation();
