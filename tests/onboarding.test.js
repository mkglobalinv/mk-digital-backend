import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.staging' });

const API_URL = `http://localhost:${process.env.PORT || 5001}`;
console.log(`[QA] Starting Reseller Onboarding Tests on ${API_URL}...`);

const testOnboarding = async () => {
    try {
        console.log("1. Creating a fresh user for onboarding...");
        const email = `partner_${Date.now()}@test.com`;
        await axios.post(`${API_URL}/register`, {
            email: email,
            password: 'password123',
            name: 'Potential Reseller'
        });

        // Login to get token
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: email,
            password: 'password123'
        });
        const token = loginRes.data.token;

        console.log("2. Submitting Reseller Intent...");
        const intentRes = await axios.post(`${API_URL}/api/reseller/activate-intent`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("   - Intent Result:", intentRes.data.message);

        console.log("3. Submitting Onboarding Branding Data...");
        const onboardingRes = await axios.post(`${API_URL}/api/reseller/submit-onboarding`, {
            subdomain: `shop_${Date.now()}`,
            siteName: 'My Test Shop',
            primaryColor: '#0000FF'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("   - Onboarding Result:", onboardingRes.data.message);

        console.log("SUCCESS: Onboarding flow verified.");
    } catch (err) {
        console.error("FAILURE: Onboarding test failed:", err.response?.data || err.message);
    }
};

testOnboarding();
