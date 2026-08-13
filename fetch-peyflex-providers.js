import axios from 'axios';
import fs from 'fs';

const PEYFLEX_API_URL = "https://client.peyflex.com.ng";
const PEYFLEX_API_TOKEN = "9f4bb911e6fd0fb4744e089941394221d588c4f6";

async function run() {
    try {
        const response = await axios.get(`${PEYFLEX_API_URL}/api/education/providers/`, {
            headers: {
                'Authorization': `Token ${PEYFLEX_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        fs.writeFileSync('peyflex-providers.json', JSON.stringify(response.data, null, 2));
        console.log("Wrote providers to peyflex-providers.json");
    } catch (e) {
        fs.writeFileSync('peyflex-providers.json', JSON.stringify(e.response?.data || e.message, null, 2));
        console.error("Fetch error, wrote to peyflex-providers.json");
    }
}
run();
