import { fetchDataPlansFromJarapoint } from '../services/providers/jarapoint.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    console.log("Fetching real Jarapoint plans for MTN...");
    try {
        const result = await fetchDataPlansFromJarapoint('MTN');
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
    process.exit(0);
}
check();
