import axios from 'axios';

const testLogin = async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/admin/login', {
      email: 'admin@system.local',
      password: 'AdminTempPass123!'
    });
    console.log('Login Success:', res.data);
  } catch (err) {
    console.error('Login Failed:', err.response?.status, err.response?.data || err.message);
  }
};

testLogin();
