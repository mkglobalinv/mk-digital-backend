import axios from 'axios';
import fs from 'fs';

const PEYFLEX_API_URL = "https://client.peyflex.com.ng";
const PEYFLEX_API_TOKEN = "034f5fa7b81a9972b5268bc7f84740ce6035bec3";

async function run() {
    try {
        // According to Peyflex API, maybe the profile endpoint lists available services/prices?
        const response = await axios.get(`${PEYFLEX_API_URL}/api/user/profile/`, {
            headers: {
                'Authorization': `Token ${PEYFLEX_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        fs.writeFileSync('peyflex-profile.json', JSON.stringify(response.data, null, 2));
        console.log("Wrote profile to peyflex-profile.json");
    } catch (e) {
        console.error("Profile fetch error:", e.message);
    }
}
run();
