import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { getDomainRequests } from './controllers/adminController.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const testAdminAPI = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const req = {};
        const res = {
            json: (data) => {
                console.log("=== API RESPONSE DATA ===");
                console.log(JSON.stringify(data, null, 2));
            },
            status: (code) => {
                console.log("STATUS:", code);
                return res;
            }
        };

        await getDomainRequests(req, res);
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Test failed:", err);
        process.exit(1);
    }
};

testAdminAPI();
