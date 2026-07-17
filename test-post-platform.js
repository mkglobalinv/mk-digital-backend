import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

async function testPost() {
    // Generate a valid owner token
    const ownerToken = jwt.sign(
        { id: 'admin123', email: 'unuktar1@gmail.com', role: 'owner' },
        process.env.JWT_SECRET || 'secret', // Assuming 'secret' or whatever is in .env
        { expiresIn: '1h' }
    );

    const payload = {
        name: 'BBC Hausa Test API',
        retailDisplayName: 'BBC Hausa',
        ownerDisplayNameTemplate: '{Brand}',
        logoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        url: 'https://bbchausa.com',
        mode: 'external',
        status: true,
        displayOrder: 1
    };

    try {
        const res = await axios.post('http://localhost:8800/api/admin/future-platforms', payload, {
            headers: {
                Authorization: `Bearer ${ownerToken}`
            }
        });
        console.log("SUCCESS!", res.data);
    } catch (err) {
        console.error("HTTP ERROR:", err.response ? err.response.data : err.message);
    }
}
testPost();
