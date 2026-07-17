import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function probeAirtimeEndpoints() {
    const key = process.env.PEYFLEX_API_TOKEN;
    const base = 'https://client.peyflex.com.ng/api';
    const endpoints = [
        '/airtime/topup/',
        '/topup/',
        '/airtime/',
        '/topup/airtime/'
    ];

    const payload = {
        network: 'mtn',
        amount: 100,
        mobile_number: '08133131020',
        Ported_number: true,
        airtime_type: "VTU"
    };

    for (const ep of endpoints) {
        console.log(`Probing: ${base}${ep}...`);
        try {
            const res = await axios.post(`${base}${ep}`, payload, {
                headers: { 'Authorization': `Token ${key}` },
                timeout: 5000
            });
            console.log(`  SUCCESS: ${ep} ->`, res.status);
            return;
        } catch (e) {
            console.log(`  FAILED: ${ep} -> Status: ${e.response?.status} | Msg: ${JSON.stringify(e.response?.data || e.message)}`);
        }
    }
}
probeAirtimeEndpoints();
