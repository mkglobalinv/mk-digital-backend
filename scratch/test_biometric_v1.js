import axios from 'axios';

async function testChallenge() {
    try {
        const res = await axios.get('http://localhost:3000/api/biometric/login-challenge?email=test@test.com');
        console.log("Success:", res.data);
    } catch (err) {
        console.log("Error:", err.response?.status, err.response?.data);
    }
}

testChallenge();
