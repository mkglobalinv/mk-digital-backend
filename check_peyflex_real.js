import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function checkPeyflexPlans() {
    const key = process.env.PEYFLEX_API_TOKEN;
    const networks = ['mtn_sme_data', 'mtn_gifting_data', 'mtn_cg_data'];
    
    for (const net of networks) {
        console.log(`Checking ${net}...`);
        try {
            const res = await axios.get('https://peyflex.com.ng/api/data/plans/', {
                params: { network: net },
                headers: { 'Authorization': `Bearer ${key}` }
            });
            console.log(`Plans for ${net}:`, JSON.stringify(res.data.plans?.slice(0, 5), null, 2));
        } catch (e) {
            console.log(`Error for ${net}:`, e.response?.data || e.message);
        }
    }
}
checkPeyflexPlans();
