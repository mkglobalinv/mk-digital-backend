import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runTests() {
  const api = axios.create({ baseURL: 'http://127.0.0.1:8800' });

  console.log("=== VERIFICATION TESTS ===\\n");

  try {
    console.log("1. muktar1@gmail.com + /admin/login");
    const res1 = await api.post('/api/admin/login', { email: 'muktar1@gmail.com', password: 'password' }).catch(e => e.response);
    // Even if password is wrong, a 401 with 'Invalid credentials' means it passed the role check or reached the auth logic correctly.
    // Wait, the new logic for admin is role: { $in: ['admin', 'superadmin'] }. If user exists, we get Invalid credentials (401) or OTP sent (200). 
    // If user is not found, we get 401 'Invalid credentials' or 404 'Admin authorization failed'.
    console.log("Status:", res1.status);
    console.log("Response:", res1.data);
  } catch(e) { console.error(e.message); }

  try {
    console.log("\\n2. muktar1@gmail.com + /super-admin/login");
    const res2 = await api.post('/api/superadmin/login', { email: 'muktar1@gmail.com', password: 'password' }).catch(e => e.response);
    console.log("Status:", res2.status);
    console.log("Response:", res2.data);
  } catch(e) { console.error(e.message); }

  try {
    console.log("\\n3. Retail credentials + /admin/login");
    // We can use a fake retail email to see if it rejects early
    const res3 = await api.post('/api/admin/login', { email: 'retail@test.com', password: 'password' }).catch(e => e.response);
    console.log("Status:", res3.status);
    console.log("Response:", res3.data);
  } catch(e) { console.error(e.message); }

  try {
    console.log("\\n4. Retail credentials + /super-admin/login");
    const res4 = await api.post('/api/superadmin/login', { email: 'retail@test.com', password: 'password' }).catch(e => e.response);
    console.log("Status:", res4.status);
    console.log("Response:", res4.data);
  } catch(e) { console.error(e.message); }

  try {
    console.log("\\n5. Reseller credentials + /admin/login");
    const res5 = await api.post('/api/admin/login', { email: 'reseller@test.com', password: 'password' }).catch(e => e.response);
    console.log("Status:", res5.status);
    console.log("Response:", res5.data);
  } catch(e) { console.error(e.message); }

  try {
    console.log("\\n6. Reseller credentials + /super-admin/login");
    const res6 = await api.post('/api/superadmin/login', { email: 'reseller@test.com', password: 'password' }).catch(e => e.response);
    console.log("Status:", res6.status);
    console.log("Response:", res6.data);
  } catch(e) { console.error(e.message); }
}

runTests();
