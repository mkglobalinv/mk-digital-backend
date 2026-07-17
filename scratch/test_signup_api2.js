import axios from 'axios';

async function testSignup() {
    try {
        const payload = {
            name: "Test User 2",
            email: "test_referral2_" + Date.now() + "@test.com",
            password: "Password123!",
            transactionPin: "1234",
            referralCode: "C119A8A0"
        };
        console.log("Sending payload to /register:", payload);
        const res = await axios.post('http://localhost:8800/register', payload);
        console.log("Success:", res.data);
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}

testSignup();
