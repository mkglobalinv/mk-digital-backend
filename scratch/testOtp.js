import axios from 'axios';

const BASE_URL = 'http://localhost:3000'; // Make sure server is running

async function testOTP() {
  const email = 'test@example.com';
  
  console.log("--- Testing OTP Request ---");
  try {
    const res1 = await axios.post(`${BASE_URL}/auth/request-otp`, { email });
    console.log("Request Success:", res1.data);
    const otp = res1.data.otp;

    if (!otp) {
      console.log("OTP not returned (likely dev mode disabled)");
      return;
    }

    console.log("--- Testing OTP Verification ---");
    const res2 = await axios.post(`${BASE_URL}/auth/verify-otp`, { email, otp });
    console.log("Verify Success:", res2.data);

    console.log("--- Testing Invalid OTP ---");
    try {
      await axios.post(`${BASE_URL}/auth/verify-otp`, { email, otp: '000000' });
    } catch (err) {
      console.log("Invalid Verify (Expected Fail):", err.response?.data);
    }

  } catch (err) {
    console.error("Test Failed:", err.response?.data || err.message);
  }
}

testOTP();
