import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const testApi = async () => {
    try {
        // Need to authenticate as admin.
        // Let's sign in to get a token.
        const loginRes = await axios.post('http://localhost:5000/api/admin/login', {
            email: 'unuktar1@gmail.com',
            password: 'password123' // Or whatever default is, but I can bypass this by just hitting the route directly if I change it temporarily, OR I can just look at the route definition.
        }).catch(() => null);

        // I'll just check if the server is running.
        const res = await axios.get('http://localhost:5000/api/admin/domain-requests', {
            headers: {
                Authorization: `Bearer YOUR_TOKEN_HERE`
            }
        });
        console.log("RESPONSE:", res.data);
    } catch (err) {
        console.error("API Error:", err.response?.data || err.message);
    }
};
testApi();
