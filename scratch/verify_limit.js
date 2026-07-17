import axios from 'axios';

async function testLimit() {
    const url = 'http://localhost:3000/api/reseller/branding';
    const largeString = 'a'.repeat(200 * 1024); // 200KB
    const payload = {
        branding: {
            siteName: 'Test Site',
            logo: largeString
        }
    };

    try {
        console.log('Sending 200KB payload...');
        const res = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                // We don't even need a valid token to test the body parser limit
                // because body-parser runs BEFORE auth middleware usually,
                // BUT in this app it might be different.
                // However, if the parser fails, it returns 413 before auth.
            }
        });
        console.log('Response:', res.status, res.data);
    } catch (err) {
        if (err.response) {
            console.log('Error Response:', err.response.status, err.response.data);
        } else {
            console.log('Error:', err.message, err.code);
        }
    }
}

testLimit();
