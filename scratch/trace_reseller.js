import axios from 'axios';

async function testRegistration() {
    try {
        console.log("--- TEST 2: Upgrade Registration ---");
        // 1. Create standard user
        await axios.post('http://localhost:8800/auth/register', {
            name: "Fail Test 3",
            email: "failtest3@example.com",
            phone: "08033333333",
            password: "password123"
        });
        console.log("User created!");
        
        // 2. Upgrade
        const res2 = await axios.post('http://localhost:8800/api/reseller/register-with-payment', {
            name: "Fail Test 3",
            email: "failtest3@example.com",
            phone: "08033333333",
            businessName: "Fail Store 3",
            state: "Lagos",
            password: "password123",
            enabledFuturePlatforms: []
        }, { headers: { 'Host': 'localhost:5173' } });
        console.log("Status:", res2.status);
        console.log("Response:", res2.data);
    } catch (e) { 
        console.log("Test 2 Failed:", e.response?.data || e.message); 
    }
}
testRegistration();
