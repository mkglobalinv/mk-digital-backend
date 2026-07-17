import axios from 'axios';

async function testLogin() {
    try {
        const res = await axios.post('http://localhost:3000/login', {
            email: 'test@example.com', // Replace with a real user if you know one
            password: 'password123'
        });
        console.log('Login Success:', res.data);
    } catch (err) {
        console.log('Login Error:', err.response?.data || err.message);
    }
}
testLogin();
