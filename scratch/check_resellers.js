import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const resellers = await User.find({ 
            $or: [
                { role: 'reseller_admin' }, 
                { role: 'reseller' },
                { whiteLabelStatus: { $exists: true } }
            ] 
        });
        console.log('Resellers found:', resellers.map(r => ({
            name: r.name,
            email: r.email, 
            role: r.role, 
            status: r.whiteLabelStatus,
            subdomain: r.subdomain
        })));
        
        const allRoles = await User.distinct('role');
        console.log('All Roles in DB:', allRoles);
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
