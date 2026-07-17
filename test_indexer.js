import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { indexRepository } from './services/codeIndexerService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const rootDir = __dirname;
        console.log('Indexing from:', rootDir);
        
        const result = await indexRepository(rootDir);
        console.log('Result:', result);
        
        mongoose.disconnect();
    } catch (e) {
        console.error('Error:', e);
        mongoose.disconnect();
    }
}

runTest();
