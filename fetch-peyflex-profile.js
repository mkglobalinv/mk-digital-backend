import dotenv from 'dotenv';
dotenv.config();

import { fetchPeyflexUserProfile } from './services/providers/peyflex.js';
import fs from 'fs';

async function run() {
    const res = await fetchPeyflexUserProfile();
    fs.writeFileSync('peyflex-profile.json', JSON.stringify(res, null, 2));
    console.log("Wrote to peyflex-profile.json");
}
run();
