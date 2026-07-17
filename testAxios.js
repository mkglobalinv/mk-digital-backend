import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Withdrawal from './models/Withdrawal.js';
import User from './models/User.js';
import jwt from 'jsonwebtoken';

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital');
        const admin = await User.findOne({ role: 'superadmin' });
        const secret = process.env.JWT_SECRET || 'mk_sub_data_secret_2024_premium';
        const token = jwt.sign({ id: admin._id, role: admin.role, sessionType: 'admin_full' }, secret, { expiresIn: '1d' });

        // Let's create a pending withdrawal just to be sure there's one
        const w = await Withdrawal.create({ userId: admin._id, amount: 500, bankName: 'test', accountNumber: '123', status: 'pending' });

        const API = axios.create({ baseURL: 'http://localhost:8800' });
        API.interceptors.request.use((req) => {
            req.headers.Authorization = 'Bearer ' + token;
            return req;
        });

        // Exact line from frontend:
        const res = await API.post('/api/admin/withdrawals/approve', { withdrawalId: w._id.toString() });
        console.log('Axios response:', res.status, res.data);
        process.exit(0);
    } catch(err) {
        console.error('Axios error:', err.response?.status, err.response?.data);
        process.exit(1);
    }
}
test();
