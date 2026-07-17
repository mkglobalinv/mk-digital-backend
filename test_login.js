import axios from 'axios';

async function runTests() {
  const api = axios.create({ baseURL: 'http://127.0.0.1:8800' });

  console.log("=== PORTAL SEPARATION TESTS ===\n");

  try {
    console.log("1. Testing Admin Portal (/api/admin/login)");
    const adminRes = await api.post('/api/admin/login', { email: 'unuktar1@gmail.com', password: 'password' }).catch(e => e.response);
    console.log("Status:", adminRes.status);
    console.log("Response:", adminRes.data);
  } catch(e) { console.error(e.message); }

  try {
    console.log("\n2. Testing Super Admin Portal (/api/super-admin/login)");
    const superAdminRes = await api.post('/api/super-admin/login', { email: 'unuktar1@gmail.com', password: 'password' }).catch(e => e.response);
    console.log("Status:", superAdminRes.status);
    console.log("Response:", superAdminRes.data);
  } catch(e) { console.error(e.message); }

  try {
    console.log("\n3. Testing Retail User Portal (/api/auth/login)");
    const retailRes = await api.post('/api/auth/login', { email: 'unuktar1@gmail.com', password: 'password' }).catch(e => e.response);
    console.log("Status:", retailRes.status);
    console.log("Response:", retailRes.data);
  } catch(e) { console.error(e.message); }
}

runTests();
