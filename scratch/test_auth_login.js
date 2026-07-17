import axios from 'axios';

const testAuthLogin = async () => {
    try {
        console.log('Sending request to http://localhost:8800/auth/login...');
        const response = await axios.post('http://localhost:8800/auth/login', {
            email: 'mksubdata@gmail.com',
            password: 'Admin@123'
        });
        console.log('Auth Login Success:', response.data);
    } catch (error) {
        console.log('Auth Login Error occurred');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error Message:', error.message);
        }
    }
};

testAuthLogin();
