require('dotenv').config();
const dns = require('dns').promises;
const mongoose = require('mongoose');
const https = require('https');
const axios = require('axios');

async function checkDNS(domain) {
    try {
        const addresses = await dns.resolve(domain);
        console.log(`[OK] DNS Resolution for ${domain}:`, addresses);
        return true;
    } catch (e) {
        console.error(`[FAIL] DNS Resolution for ${domain} failed:`, e.message);
        return false;
    }
}

async function checkMongoConnectivity() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('[FAIL] MONGO_URI is missing');
        return false;
    }
    try {
        console.log('Testing MongoDB connection...');
        await mongoose.connect(uri, { 
            serverSelectionTimeoutMS: 5000 
        });
        console.log('[OK] MongoDB Atlas connected successfully');
        await mongoose.disconnect();
        return true;
    } catch (e) {
        console.error('[FAIL] MongoDB Atlas connection failed:', e.message);
        return false;
    }
}

async function checkHTTPS(url, headers = {}) {
    try {
        const response = await axios.get(url, { 
            headers,
            timeout: 10000 
        });
        console.log(`[OK] HTTP/HTTPS Outbound to ${url} - Status: ${response.status}`);
        return true;
    } catch (e) {
        if (e.response) {
            console.log(`[OK] HTTP/HTTPS Outbound to ${url} - Reached but returned status: ${e.response.status}`);
            return true; // We just care about connectivity, not necessarily 200 OK
        }
        console.error(`[FAIL] HTTP/HTTPS Outbound to ${url} failed:`, e.message);
        return false;
    }
}

async function testSSL(hostname) {
    return new Promise((resolve) => {
        const req = https.request({
            hostname: hostname,
            port: 443,
            method: 'GET',
            rejectUnauthorized: true,
            timeout: 5000
        }, (res) => {
            console.log(`[OK] SSL/TLS Handshake successful with ${hostname}`);
            resolve(true);
        });

        req.on('error', (e) => {
            console.error(`[FAIL] SSL/TLS Handshake with ${hostname} failed:`, e.message);
            resolve(false);
        });
        
        req.on('timeout', () => {
            req.destroy();
            console.error(`[FAIL] SSL/TLS Handshake with ${hostname} timed out`);
            resolve(false);
        });

        req.end();
    });
}

async function validatePeyflex() {
    console.log('\n--- Validating Peyflex ---');
    const token = process.env.PEYFLEX_API_TOKEN;
    try {
        const res = await axios.get('https://client.peyflex.com.ng/api/profile/', {
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        console.log(`[OK] Peyflex Auth successful. Status: ${res.status}`);
        return true;
    } catch (e) {
        console.error(`[FAIL] Peyflex Auth failed:`, e.response ? e.response.status : e.message);
        return false;
    }
}

async function validateClubkonnect() {
    console.log('\n--- Validating Clubkonnect ---');
    const userid = process.env.CLUBKONNECT_USERID;
    const apikey = process.env.CLUBKONNECT_API_KEY;
    try {
        const url = `https://www.nellobytesystems.com/APIWalletBalanceV1.asp?UserID=${userid}&APIKey=${apikey}`;
        const res = await axios.get(url, { timeout: 10000 });
        if (res.data && (typeof res.data === 'string' && !res.data.includes('INVALID') || typeof res.data === 'object')) {
            console.log(`[OK] Clubkonnect Auth successful.`);
            return true;
        }
        console.error(`[FAIL] Clubkonnect Auth failed. Response:`, String(res.data).substring(0, 50));
        return false;
    } catch (e) {
        console.error(`[FAIL] Clubkonnect Auth failed:`, e.message);
        return false;
    }
}

async function validateJarapoint() {
    console.log('\n--- Validating Jarapoint ---');
    const apikey = process.env.JARAPOINT_API_KEY;
    try {
        const res = await axios.get('https://jarapoint.com/api/profile', {
            headers: { 'Authorization': `Bearer ${apikey}` },
            timeout: 10000
        });
        console.log(`[OK] Jarapoint Auth successful. Status: ${res.status}`);
        return true;
    } catch (e) {
        // Jarapoint might not have a /profile endpoint, maybe 404, but auth could be valid if it doesn't return 401
        if (e.response && e.response.status !== 401 && e.response.status !== 403) {
            console.log(`[OK] Jarapoint connectivity established (Status: ${e.response.status})`);
            return true;
        }
        console.error(`[FAIL] Jarapoint Auth failed:`, e.response ? e.response.status : e.message);
        return false;
    }
}

async function run() {
    console.log('====================================');
    console.log('   PRODUCTION READINESS VALIDATOR   ');
    console.log('====================================\n');

    console.log('--- 1. Environment & DNS Checks ---');
    await checkDNS('cluster0.hj9idyn.mongodb.net');
    await checkDNS('client.peyflex.com.ng');
    await checkDNS('www.nellobytesystems.com');
    await checkDNS('jarapoint.com');

    console.log('\n--- 2. Database Connectivity ---');
    await checkMongoConnectivity();

    console.log('\n--- 3. SSL/TLS Handshakes ---');
    await testSSL('client.peyflex.com.ng');
    await testSSL('www.nellobytesystems.com');
    await testSSL('jarapoint.com');

    console.log('\n--- 4. API Authentication & Connectivity ---');
    await validatePeyflex();
    await validateClubkonnect();
    await validateJarapoint();

    console.log('\n====================================');
    console.log('      VALIDATION COMPLETE     ');
    console.log('====================================');
}

run();
