import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function fetchPlans() {
    const key = process.env.JARAPOINT_API_KEY;
    const networks = ["MTN", "AIRTEL", "GLO", "9MOBILE"];
    
    for (const nw of networks) {
        console.log(`--- Fetching plans for ${nw} ---`);
        try {
            // Try GET first as it's common for plan listing
            const res = await axios.get(`https://jarapoint.com/api/data/?network=${nw}`, {
                headers: { 
                    'Authorization': `Token ${key}`,
                    'Accept': 'application/json'
                }
            });
            console.log(`GET Response for ${nw}:`, JSON.stringify(res.data, null, 2));
        } catch (e) {
            console.log(`GET Error for ${nw}:`, e.response?.data || e.message);
            
            // Try POST if GET fails
            try {
                const resPost = await axios.post(`https://jarapoint.com/api/data/`, {
                    network: nw,
                    type: 'sme'
                }, {
                    headers: { 
                        'Authorization': `Token ${key}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`POST Response for ${nw}:`, JSON.stringify(resPost.data, null, 2));
            } catch (ep) {
                console.log(`POST Error for ${nw}:`, ep.response?.data || ep.message);
            }
        }
        console.log("------------------------");
    }
}

fetchPlans();
