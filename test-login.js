import axios from 'axios';

async function testLogin() {
    try {
        console.log('Testing login...');
        const res = await axios.post('http://localhost:3000/login', {
            email: 'test@test.com',
            password: 'password123'
        });
        console.log('Login Result:', res.data);
    } catch (err) {
        console.log('Login Error:', err.response?.data || err.message);
    }
}

testLogin();
