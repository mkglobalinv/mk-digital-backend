import axios from 'axios';

async function testRegistration() {
    try {
        console.log("Sending request to /api/reseller/register-with-payment...");
        const response = await axios.post('http://localhost:8800/api/reseller/register-with-payment', {
            name: "Test Reseller",
            email: "testreseller123@example.com",
            phone: "08012345678",
            businessName: "Test Store 123",
            state: "Lagos",
            password: "password123",
            enabledFuturePlatforms: []
        }, {
            headers: {
                'Host': 'localhost:5173' // Mock main domain to pass restrictToMainDomain
            }
        });
        console.log("Status:", response.status);
        console.log("Response:", response.data);
    } catch (error) {
        console.log("Status:", error.response?.status);
        console.log("Response Data:", error.response?.data);
        console.log("Error Message:", error.message);
    }
}

testRegistration();
