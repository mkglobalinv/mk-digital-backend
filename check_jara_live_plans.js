import { fetchDataPlansFromJarapoint } from './services/providers/jarapoint.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const networks = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];
    for (const nw of networks) {
        console.log(`--- ${nw} ---`);
        const result = await fetchDataPlansFromJarapoint(nw);
        if (result.liveData) {
            console.log(JSON.stringify(result.liveData.slice(0, 5), null, 2));
        } else {
            console.log("No live data received.");
        }
    }
}

test();
