import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
mongoose.connect('mongodb://localhost:27017/vtuapp').then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({ role: { $in: ['admin', 'superadmin'] } }).toArray();
    console.log(users.map(u => ({ email: u.email, role: u.role })));
    process.exit(0);
});
