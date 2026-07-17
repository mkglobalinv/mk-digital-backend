import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import AFTER dotenv config
const { getPeyflexDataNetworks } = await import('../services/providers/peyflex.js');

getPeyflexDataNetworks().then(res => console.log(JSON.stringify(res, null, 2)));
