import axios from 'axios';

const testLogin = async () => {
    try {
        const response = await axios.post('http://localhost:8800/login', {
            email: 'mksubdata@gmail.com',
            password: 'Admin@123'
        });
        console.log('Login Response:', response.data);
    } catch (error) {
        console.error('Login Error:', error.response?.data || error.message);
    }
};

testLogin();
