import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function brute() {
    const key = process.env.JARAPOINT_API_KEY;
    const paths = [
        "https://jarapoint.com/api/data/plans/",
        "https://jarapoint.com/api/data/plans",
        "https://jarapoint.com/api/data/plan/",
        "https://jarapoint.com/api/data/plan",
        "https://jarapoint.com/api/plans/",
        "https://jarapoint.com/api/data/",
        "https://jarapoint.com/data/plans/",
        "https://jarapoint.com/data/plan/",
        "https://jarapoint.com/plans/",
        "https://jarapoint.com/api/v1/data/plans/",
        "https://jarapoint.com/api/v2/data/plans/",
    ];

    for (const p of paths) {
        try {
            const res = await axios.get(p, {
                headers: { 'Authorization': `Token ${key}` },
                timeout: 2000
            });
            console.log(`SUCCESS: ${p}`);
            process.exit(0);
        } catch (e) {
            console.log(`FAIL [${e.response?.status}]: ${p}`);
        }
    }
}
brute();
