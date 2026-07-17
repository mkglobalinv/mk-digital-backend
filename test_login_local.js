import axios from 'axios';

async function testLogin() {
    try {
        const res = await axios.post('http://localhost:3000/login', {
            email: 'test@example.com',
            password: 'password123'
        });
        console.log("SUCCESS:", res.data);
    } catch (e) {
        console.log("ERROR STATUS:", e.response?.status);
        console.log("ERROR DATA:", e.response?.data);
    }
}
testLogin();
