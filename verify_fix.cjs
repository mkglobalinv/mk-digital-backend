const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:8800/api';

async function verify() {
  try {
    console.log('--- STARTING VERIFICATION FLOW ---');
    
    // 1. Get the pending request ID and user email
    const uri = 'mongodb+srv://unuktar1_db_user:%40Zainabimksub@cluster0.hj9idyn.mongodb.net/vtuApp?appName=Cluster0';
    await mongoose.connect(uri);
    const request = await mongoose.connection.collection('resellerrequests').findOne({status: 'pending'});
    if (!request) {
      console.log('NO PENDING REQUEST FOUND');
      process.exit(1);
    }
    const requestId = request._id.toString();
    const userId = request.userId;
    console.log('Found Pending Request ID:', requestId);
    mongoose.disconnect();

    // 2. Admin Login Step 1
    console.log('Admin Login Step 1...');
    const step1Res = await axios.post(`${BASE_URL}/admin/login`, {
      email: 'unuktar1@gmail.com',
      password: 'Admin123!'
    });
    const partialToken = step1Res.data.partialToken;

    // 3. Admin Login Step 2 (OTP)
    console.log('Admin Login Step 2...');
    const step2Res = await axios.post(`${BASE_URL}/admin/login/verify-otp`, {
      partialToken,
      otp: '123456'
    });
    console.log('Step 2 Response:', step2Res.data);
    const adminToken = step2Res.data.token || step2Res.data.step2Token;
    console.log('Admin Login Successful');

    // 4. Approve the Reseller Request
    console.log('Approving Reseller Request...');
    const approveRes = await axios.post(`${BASE_URL}/admin/reseller-requests/${requestId}/approve`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Approval Response:', approveRes.status, approveRes.data);

    // 5. Test Login as the approved user
    console.log('Logging in as Approved Website Owner...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'reffar34@gmail.com',
      password: 'Password123!',
      session_type: 'business'
    });
    console.log('User Login Successful. Role:', loginRes.data.user.role);

    console.log('--- VERIFICATION COMPLETE AND SUCCESSFUL ---');
  } catch (err) {
    console.error('VERIFICATION FAILED:', err.response ? err.response.data : err.message);
  }
}

verify();
