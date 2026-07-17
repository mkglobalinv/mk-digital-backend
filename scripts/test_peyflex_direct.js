import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { buyDataWithPeyflex } from '../services/providers/peyflex.js';

async function test() {
    console.log("Testing buyDataWithPeyflex directly...");
    const res = await buyDataWithPeyflex("mtn_awoof_gifting", "M1GBA", "08012345678");
    console.log("Result:", JSON.stringify(res, null, 2));
}

test();
